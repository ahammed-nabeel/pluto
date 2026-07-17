import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // 1. Get all board IDs the user is a member/owner of
    const memberships = await prisma.boardMember.findMany({
      where: { user_id: user.id },
      select: { board_id: true },
    });
    const boardIds = memberships.map((m) => m.board_id);

    if (boardIds.length === 0) {
      return Response.json({
        data: {
          totalOpen: 0,
          myTasks: 0,
          dueToday: 0,
          plannerTasks: [],
        },
      });
    }

    // Get today's range in local/UTC time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Query all tasks belonging to cards in these boards
    const tasks = await prisma.task.findMany({
      where: {
        card: {
          board_id: { in: boardIds },
        },
      },
      include: {
        card: {
          select: {
            id: true,
            project_name: true,
            board_id: true,
            board: { select: { name: true } },
          },
        },
        assignee: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    // Filter statistics
    const openTasks = tasks.filter((t) => t.status !== "completed");
    const totalOpen = openTasks.length;
    const myTasks = openTasks.filter((t) => t.assigned_to === user.id).length;

    const dueToday = openTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= startOfToday && d <= endOfToday;
    }).length;

    // Filter planner tasks (only tasks that have a due date)
    const plannerTasks = tasks
      .filter((t) => t.due_date !== null)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        due_date: t.due_date,
        projectName: t.card.project_name,
        boardName: t.card.board.name,
        cardId: t.card_id,
        boardId: t.card.board_id,
      }));

    return Response.json({
      data: {
        totalOpen,
        myTasks,
        dueToday,
        plannerTasks,
      },
    });
  } catch (error) {
    console.error("[GET /api/dashboard/tasks]", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return serverErrorResponse();
  }
}
