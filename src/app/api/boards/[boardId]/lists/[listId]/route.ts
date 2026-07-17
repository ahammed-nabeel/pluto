import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canManageLists, forbiddenResponse, serverErrorResponse } from "@/lib/permissions";
import { UpdateListSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string; listId: string }> };

// PATCH /api/boards/[boardId]/lists/[listId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { boardId, listId } = await params;
    const user = await requireAuth();

    const allowed = await canManageLists(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = UpdateListSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const list = await prisma.list.update({
      where: { id: listId, board_id: boardId },
      data: parsed.data,
    });

    await logActivity({
      boardId,
      action: `Updated list '${list.title}'`,
      actionType: ActivityTypes.LIST_UPDATED,
      performedBy: user.id,
    });

    return Response.json({ data: list });
  } catch (error) {
    return serverErrorResponse();
  }
}

// DELETE /api/boards/[boardId]/lists/[listId]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { boardId, listId } = await params;
    const user = await requireAuth();

    const allowed = await canManageLists(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    // Check for cards — never silently delete
    const cardCount = await prisma.card.count({ where: { list_id: listId } });
    const archiveCards = req.nextUrl.searchParams.get("archiveCards") === "true";

    if (cardCount > 0 && !archiveCards) {
      return Response.json({
        error: `List has ${cardCount} cards. Pass archiveCards=true to confirm deletion.`,
        cardCount,
      }, { status: 409 });
    }

    const list = await prisma.list.findUnique({ where: { id: listId } });

    // Archive cards to the first available list, or delete them
    if (archiveCards && cardCount > 0) {
      const firstOtherList = await prisma.list.findFirst({
        where: { board_id: boardId, id: { not: listId } },
        orderBy: { position: "asc" },
      });

      if (firstOtherList) {
        await prisma.card.updateMany({
          where: { list_id: listId },
          data: { list_id: firstOtherList.id },
        });
      } else {
        // No other list — just delete the cards
        await prisma.card.deleteMany({ where: { list_id: listId } });
      }
    }

    await prisma.list.delete({ where: { id: listId } });

    await logActivity({
      boardId,
      action: `Deleted list '${list?.title}'`,
      actionType: ActivityTypes.LIST_DELETED,
      performedBy: user.id,
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
