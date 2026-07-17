import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { serverErrorResponse } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // 1. Get all board ids user is member or owner of
    const memberships = await prisma.boardMember.findMany({
      where: { user_id: user.id },
      select: { board_id: true }
    });
    const boardIds = memberships.map((m) => m.board_id);

    // Also include boards owned directly by user
    const ownedBoards = await prisma.board.findMany({
      where: { owner_id: user.id },
      select: { id: true }
    });
    const ownedBoardIds = ownedBoards.map((b) => b.id);

    const allBoardIds = Array.from(new Set([...boardIds, ...ownedBoardIds]));

    if (allBoardIds.length === 0) {
      return Response.json({ data: [] });
    }

    // 2. Fetch recent activity logs (past 15 items)
    const logs = await prisma.activityLog.findMany({
      where: {
        board_id: { in: allBoardIds },
        performed_by: { not: user.id } // Don't notify the user about their own actions
      },
      include: {
        performer: { select: { name: true, profile_picture_url: true } },
        card: { select: { project_name: true } }
      },
      orderBy: { timestamp: "desc" },
      take: 15
    });

    // Map logs to notifications schema
    const activityNotifications = logs.map((log) => ({
      id: log.id,
      type: "activity",
      title: log.card?.project_name ? `Update in '${log.card.project_name}'` : "Board Update",
      message: `${log.performer?.name || "Someone"} ${log.action}`,
      timestamp: log.timestamp.toISOString(),
      link: log.card_id ? `/boards/${log.board_id}` : `/boards/${log.board_id}`
    }));

    // 3. Fetch due tasks (due within next 48 hours or overdue, pending, on user's boards)
    const today = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        card: { board_id: { in: allBoardIds }, is_archived: false },
        status: "pending",
        due_date: {
          lte: new Date(today.getTime() + 48 * 60 * 60 * 1000) // Next 48 hours
        }
      },
      include: {
        card: { select: { project_name: true, board_id: true } },
        assignee: { select: { name: true } }
      },
      orderBy: { due_date: "asc" },
      take: 10
    });

    const dueNotifications = tasks.map((task) => {
      const isOverdue = task.due_date && new Date(task.due_date) < today;
      return {
        id: task.id,
        type: "reminder",
        title: isOverdue ? "⚠️ Overdue Task" : "📅 Task Due Soon",
        message: `Task '${task.title}' on '${task.card.project_name}' is due ${
          task.due_date ? new Date(task.due_date).toLocaleDateString() : "soon"
        }`,
        timestamp: task.created_at.toISOString(),
        link: `/boards/${task.card.board_id}`
      };
    });

    // 4. Combine notifications and sort by timestamp
    const notifications = [...dueNotifications, ...activityNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return Response.json({ data: notifications });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[GET /api/notifications]", error);
    return serverErrorResponse();
  }
}
