import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BoardViewWrapper } from "@/components/kanban/BoardViewWrapper";
import { canViewBoard } from "@/lib/permissions";
import type { Metadata } from "next";

type Params = { params: Promise<{ boardId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { boardId } = await params;
  const board = await prisma.board.findFirst({
    where: {
      OR: [
        { id: boardId },
        { slug: boardId },
      ],
    },
  });
  return { title: board?.name ?? "Board" };
}

async function getBoard(boardId: string, userId: string, role: string) {
  const board = await prisma.board.findFirst({
    where: {
      OR: [
        { id: boardId },
        { slug: boardId },
      ],
    },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            where: { is_archived: false },
            orderBy: { position: "asc" },
            include: {
              cardOwner: { select: { id: true, name: true, profile_picture_url: true } },
              tasks: {
                include: {
                  assignee: { select: { id: true, name: true, profile_picture_url: true } },
                },
              },
              _count: { select: { checklistItems: true, attachments: true } },
            },
          },
        },
      },
      activityLogs: {
        include: {
          performer: { select: { id: true, name: true, profile_picture_url: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 30,
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!board) return null;

  // Check access
  const allowed = await canViewBoard(board.id, userId, role);
  if (!allowed) return null;

  return board;
}

export default async function BoardPage({ params }: Params) {
  const { boardId } = await params;
  const session = await auth();
  const user = session!.user;

  const board = await getBoard(boardId, user.id, user.role);
  if (!board) notFound();

  const membership = board.members.find((m) => m.user_id === user.id);
  const isAdmin = user.role === "super_admin" || membership?.role === "admin";
  const canCreate = isAdmin || membership?.role === "member";

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-slate-500 mt-0.5">{board.description}</p>
          )}
        </div>

        {isAdmin && (
          <a
            href={`/boards/${board.id}/settings`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 bg-white"
          >
            Settings
          </a>
        )}
      </div>

      {/* Main Tab view wrapper */}
      <div className="flex-1 overflow-hidden">
        <BoardViewWrapper
          board={{
            ...board,
            activityLogs: board.activityLogs.map((log) => ({
              ...log,
              timestamp: log.timestamp.toISOString(),
            })),
            lists: board.lists.map((l) => ({
              ...l,
              cards: l.cards.map((c) => ({
                ...c,
                card_value: c.card_value ? Number(c.card_value) : null,
                location_lat: c.location_lat ? Number(c.location_lat) : null,
                location_lng: c.location_lng ? Number(c.location_lng) : null,
                created_at: c.created_at.toISOString(),
                updated_at: c.updated_at.toISOString(),
                tasks: c.tasks.map((t) => ({
                  ...t,
                  due_date: t.due_date ? t.due_date.toISOString() : null,
                })),
                _count: {
                  ...c._count,
                  tasks: c.tasks.length,
                },
              })),
            })),
          }}
          canManageLists={isAdmin}
          canCreateCard={canCreate}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
