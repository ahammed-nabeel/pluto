import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  canViewBoard,
  canManageLists,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/permissions";
import { CreateListSchema, UpdateListSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

// GET /api/boards/[boardId]/lists
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canViewBoard(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const lists = await prisma.list.findMany({
      where: { board_id: boardId },
      orderBy: { position: "asc" },
      include: {
        _count: { select: { cards: true } },
      },
    });

    return Response.json({ data: lists });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/boards/[boardId]/lists
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canManageLists(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = CreateListSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Get max position to append at end
    const last = await prisma.list.findFirst({
      where: { board_id: boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = parsed.data.position ?? (last ? last.position + 1000 : 1000);

    const list = await prisma.list.create({
      data: {
        board_id: boardId,
        title: parsed.data.title,
        position,
        created_by: user.id,
      },
    });

    await logActivity({
      boardId,
      action: `Created list '${list.title}'`,
      actionType: ActivityTypes.LIST_CREATED,
      performedBy: user.id,
    });

    return Response.json({ data: list }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}
