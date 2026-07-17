import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  canViewBoard,
  canManageMembers,
  serverErrorResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/permissions";
import { UpdateBoardSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

// GET /api/boards/[boardId]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    // Find the board first by id or slug
    const foundBoard = await prisma.board.findFirst({
      where: {
        OR: [
          { id: boardId },
          { slug: boardId },
        ],
      },
      select: { id: true }
    });
    if (!foundBoard) return notFoundResponse("Board");

    const allowed = await canViewBoard(foundBoard.id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const board = await prisma.board.findUnique({
      where: { id: foundBoard.id },
      include: {
        owner: { select: { id: true, name: true, email: true, profile_picture_url: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, profile_picture_url: true, role: true } },
          },
          orderBy: { joined_at: "asc" },
        },
        lists: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { is_archived: false },
              orderBy: { position: "asc" },
              include: {
                cardOwner: { select: { id: true, name: true, profile_picture_url: true } },
                _count: { select: { tasks: true, checklistItems: true, attachments: true } },
              },
            },
          },
        },
        _count: { select: { cards: true } },
      },
    });

    if (!board) return notFoundResponse("Board");
    return Response.json({ data: board });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[GET /api/boards/[boardId]]", error);
    return serverErrorResponse();
  }
}

// PATCH /api/boards/[boardId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    // Find the board first by id or slug
    const foundBoard = await prisma.board.findFirst({
      where: {
        OR: [
          { id: boardId },
          { slug: boardId },
        ],
      },
      select: { id: true }
    });
    if (!foundBoard) return notFoundResponse("Board");

    const allowed = await canManageMembers(foundBoard.id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = UpdateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const board = await prisma.board.update({
      where: { id: foundBoard.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        settings: parsed.data.settings ? (parsed.data.settings as any) : undefined,
      },
    });

    await logActivity({
      boardId: foundBoard.id,
      action: `Updated board '${board.name}'`,
      actionType: ActivityTypes.BOARD_UPDATED,
      performedBy: user.id,
    });

    return Response.json({ data: board });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return serverErrorResponse();
  }
}

// DELETE /api/boards/[boardId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    // Find the board first by id or slug
    const foundBoard = await prisma.board.findFirst({
      where: {
        OR: [
          { id: boardId },
          { slug: boardId },
        ],
      },
    });
    if (!foundBoard) return notFoundResponse("Board");

    // Only board admin or super admin can delete
    const allowed = await canManageMembers(foundBoard.id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    // Only owner or super admin can delete
    if (foundBoard.owner_id !== user.id && user.role !== "super_admin") {
      return forbiddenResponse();
    }

    await prisma.board.delete({ where: { id: foundBoard.id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return serverErrorResponse();
  }
}
