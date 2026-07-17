import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  canManageMembers,
  canViewBoard,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/permissions";
import { InviteMemberSchema, UpdateMemberSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

// GET /api/boards/[boardId]/members
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canViewBoard(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const members = await prisma.boardMember.findMany({
      where: { board_id: boardId },
      include: {
        user: {
          select: { id: true, name: true, email: true, profile_picture_url: true, role: true, last_login: true },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    return Response.json({ data: members });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/boards/[boardId]/members — invite a user by email
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canManageMembers(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = InviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, role, permissions } = parsed.data;

    // Find user by email
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return Response.json({ error: "User not found. They must sign in first." }, { status: 404 });
    }

    // Prevent duplicate membership
    const existing = await prisma.boardMember.findUnique({
      where: { board_id_user_id: { board_id: boardId, user_id: invitee.id } },
    });
    if (existing) {
      return Response.json({ error: "User is already a board member." }, { status: 409 });
    }

    const defaultPerms = {
      create_list: role === "admin",
      delete_card: role === "admin" || role === "editor",
      assign_task: role !== "viewer",
      view_reports: role !== "viewer",
      manage_members: role === "admin",
    };

    const member = await prisma.boardMember.create({
      data: {
        board_id: boardId,
        user_id: invitee.id,
        role,
        permissions: permissions ?? defaultPerms,
      },
      include: {
        user: { select: { id: true, name: true, email: true, profile_picture_url: true } },
      },
    });

    await logActivity({
      boardId,
      action: `Added ${invitee.name} as ${role}`,
      actionType: ActivityTypes.MEMBER_ADDED,
      performedBy: user.id,
      metadata: { invitee_id: invitee.id, role },
    });

    return Response.json({ data: member }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}

// PATCH /api/boards/[boardId]/members?userId=xxx — update member role/permissions
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const allowed = await canManageMembers(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const member = await prisma.boardMember.update({
      where: { board_id_user_id: { board_id: boardId, user_id: userId } },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      boardId,
      action: `Updated ${member.user.name}'s role to ${member.role}`,
      actionType: ActivityTypes.MEMBER_ROLE_CHANGED,
      performedBy: user.id,
    });

    return Response.json({ data: member });
  } catch (error) {
    return serverErrorResponse();
  }
}

// DELETE /api/boards/[boardId]/members?userId=xxx — remove member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const allowed = await canManageMembers(boardId, user.id, user.role);
    if (!allowed && userId !== user.id) return forbiddenResponse(); // Allow self-removal

    const member = await prisma.boardMember.findUnique({
      where: { board_id_user_id: { board_id: boardId, user_id: userId } },
      include: { user: true },
    });

    if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

    // Cannot remove the only admin
    if (member.role === "admin") {
      const adminCount = await prisma.boardMember.count({
        where: { board_id: boardId, role: "admin" },
      });
      if (adminCount <= 1) {
        return Response.json({ error: "Cannot remove the last admin" }, { status: 400 });
      }
    }

    await prisma.boardMember.delete({
      where: { board_id_user_id: { board_id: boardId, user_id: userId } },
    });

    await logActivity({
      boardId,
      action: `Removed ${member.user.name} from board`,
      actionType: ActivityTypes.MEMBER_REMOVED,
      performedBy: user.id,
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
