import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { UpdateChecklistItemSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ itemId: string }> };

// PATCH /api/checklists/[itemId] — toggle or update
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;
    const user = await requireAuth();

    const existing = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { card: true },
    });
    if (!existing) return notFoundResponse("Checklist item");

    const body = await req.json();
    const parsed = UpdateChecklistItemSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Handle check toggle with timestamp
    if (parsed.data.is_checked !== undefined) {
      if (parsed.data.is_checked) {
        updateData.checked_by = user.id;
        updateData.checked_at = new Date();
      } else {
        updateData.checked_by = null;
        updateData.checked_at = null;
      }
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData,
      include: { checker: { select: { id: true, name: true } } },
    });

    // Log checklist progress
    if (parsed.data.is_checked !== undefined) {
      await logActivity({
        boardId: existing.card.board_id,
        cardId: existing.card_id,
        action: parsed.data.is_checked
          ? `Checked '${item.item_text}'`
          : `Unchecked '${item.item_text}'`,
        actionType: parsed.data.is_checked
          ? ActivityTypes.CHECKLIST_ITEM_CHECKED
          : ActivityTypes.CHECKLIST_ITEM_UNCHECKED,
        performedBy: user.id,
      });
    }

    return Response.json({ data: item });
  } catch (error) {
    return serverErrorResponse();
  }
}

// DELETE /api/checklists/[itemId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;
    await requireAuth();

    await prisma.checklistItem.delete({ where: { id: itemId } });
    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
