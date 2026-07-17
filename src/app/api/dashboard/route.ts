import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";

// GET /api/dashboard?boardId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const boardId = req.nextUrl.searchParams.get("boardId");

    const boardWhere =
      user.role === "super_admin"
        ? boardId ? { id: boardId } : {}
        : boardId
          ? { id: boardId, members: { some: { user_id: user.id } } }
          : { members: { some: { user_id: user.id } } };

    // Get all accessible boards
    const boards = await prisma.board.findMany({
      where: boardWhere,
      select: { id: true },
    });
    const boardIds = boards.map((b) => b.id);

    if (boardIds.length === 0) {
      return Response.json({
        data: {
          totalCards: 0,
          totalCardValue: 0,
          cardsByList: [],
          cardsByLabel: [],
          cardsBySource: [],
          tasksByStatus: [],
          tasksByUser: [],
          overdueTasksCount: 0,
          recentActivity: [],
        },
      });
    }

    // Parallel queries for performance using standard Prisma ORM APIs
    const [
      listsWithCardStats,
      cardsByLabel,
      cardsBySource,
      tasksByStatus,
      tasksByUserSummary,
      recentActivity,
    ] = await Promise.all([
      // Get all lists in the boards, and include their cards' count and sum values
      prisma.list.findMany({
        where: { board_id: { in: boardIds } },
        select: {
          id: true,
          title: true,
          cards: {
            select: {
              id: true,
              card_value: true,
            },
          },
        },
        orderBy: { position: "asc" },
      }),

      // Cards by label
      prisma.card.groupBy({
        by: ["label"],
        where: { board_id: { in: boardIds } },
        _count: { id: true },
        _sum: { card_value: true },
      }),

      // Cards by source
      prisma.card.groupBy({
        by: ["source"],
        where: { board_id: { in: boardIds } },
        _count: { id: true },
      }),

      // Tasks by status
      prisma.task.groupBy({
        by: ["status"],
        where: { card: { board_id: { in: boardIds } } },
        _count: { id: true },
      }),

      // Tasks by assigned user
      prisma.task.groupBy({
        by: ["assigned_to"],
        where: {
          card: { board_id: { in: boardIds } },
          status: { not: "completed" },
          assigned_to: { not: null },
        },
        _count: { id: true },
      }),

      // Recent activity
      prisma.activityLog.findMany({
        where: { board_id: { in: boardIds } },
        include: {
          performer: { select: { id: true, name: true, profile_picture_url: true } },
          card: { select: { id: true, project_name: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 20,
      }),
    ]);

    // Fetch assignee details for user tasks summary
    const userIds = tasksByUserSummary
      .map((t) => t.assigned_to)
      .filter((id): id is string => !!id);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const tasksByUser = tasksByUserSummary.map((t) => {
      const user = users.find((u) => u.id === t.assigned_to);
      return {
        userId: t.assigned_to!,
        userName: user?.name ?? "Assigned User",
        count: t._count.id,
      };
    });

    // Map lists to standard statistics shape
    const cardsByList = listsWithCardStats.map((l) => {
      const count = l.cards.length;
      const value = l.cards.reduce((sum, c) => sum + Number(c.card_value ?? 0), 0);
      return {
        list_id: l.id,
        list_title: l.title,
        count,
        value,
      };
    });

    // Compute total cards and value
    const totalCards = cardsByList.reduce((sum, r) => sum + Number(r.count), 0);
    const totalCardValue = cardsByList.reduce((sum, r) => sum + Number(r.value), 0);

    // Overdue count
    const overdueTasksCount = tasksByStatus.find((t) => t.status === "overdue")?._count.id ?? 0;

    return Response.json({
      data: {
        totalCards,
        totalCardValue,
        cardsByList: cardsByList.map((r) => ({
          listId: r.list_id,
          listTitle: r.list_title,
          count: Number(r.count),
          value: Number(r.value),
        })),
        cardsByLabel: cardsByLabel.map((r) => ({
          label: r.label ?? "None",
          count: r._count.id,
          value: Number(r._sum.card_value ?? 0),
        })),
        cardsBySource: cardsBySource.map((r) => ({
          source: r.source ?? "Other",
          count: r._count.id,
        })),
        tasksByStatus: tasksByStatus.map((r) => ({
          status: r.status,
          count: r._count.id,
        })),
        tasksByUser: tasksByUser.map((r) => ({
          userId: r.userId,
          userName: r.userName,
          count: Number(r.count),
        })),
        overdueTasksCount,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return serverErrorResponse();
  }
}
