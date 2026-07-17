import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canManageLists, forbiddenResponse, serverErrorResponse } from "@/lib/permissions";
import { ReorderListsSchema } from "@/lib/validations";

type Params = { params: Promise<{ boardId: string }> };

// POST /api/boards/[boardId]/lists/reorder
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canManageLists(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = ReorderListsSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    // Batch update positions
    await prisma.$transaction(
      parsed.data.lists.map(({ id, position }) =>
        prisma.list.update({
          where: { id, board_id: boardId },
          data: { position },
        })
      )
    );

    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
