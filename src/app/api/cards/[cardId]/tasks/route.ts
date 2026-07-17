import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canViewBoard, canAssignTasks, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { CreateTaskSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// GET /api/cards/[cardId]/tasks
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const tasks = await prisma.task.findMany({
      where: { card_id: cardId },
      include: {
        assignee: { select: { id: true, name: true, profile_picture_url: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return Response.json({ data: tasks });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/cards/[cardId]/tasks
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canAssignTasks(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const task = await prisma.task.create({
      data: {
        card_id: cardId,
        ...parsed.data,
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
        created_by: user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    await logActivity({
      boardId: card.board_id,
      cardId: card.id,
      action: `Created task '${task.title}'${task.assigned_to ? ` assigned to user` : ""}`,
      actionType: ActivityTypes.TASK_CREATED,
      performedBy: user.id,
    });

    return Response.json({ data: task }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}
