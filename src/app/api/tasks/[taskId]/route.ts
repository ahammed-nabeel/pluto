import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse, notFoundResponse, forbiddenResponse } from "@/lib/permissions";
import { UpdateTaskSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ taskId: string }> };

// PATCH /api/tasks/[taskId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { taskId } = await params;
    const user = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { card: true },
    });
    if (!task) return notFoundResponse("Task");

    const body = await req.json();
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsed.data,
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    // Log completion
    if (parsed.data.status === "completed" && task.status !== "completed") {
      await logActivity({
        boardId: task.card.board_id,
        cardId: task.card_id,
        action: `Completed task '${task.title}'`,
        actionType: ActivityTypes.TASK_COMPLETED,
        performedBy: user.id,
      });
    } else if (parsed.data.assigned_to && parsed.data.assigned_to !== task.assigned_to) {
      await logActivity({
        boardId: task.card.board_id,
        cardId: task.card_id,
        action: `Assigned task '${task.title}'`,
        actionType: ActivityTypes.TASK_ASSIGNED,
        performedBy: user.id,
      });
    }

    return Response.json({ data: updated });
  } catch (error) {
    return serverErrorResponse();
  }
}

// DELETE /api/tasks/[taskId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { taskId } = await params;
    const user = await requireAuth();

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFoundResponse("Task");

    await prisma.task.delete({ where: { id: taskId } });
    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
