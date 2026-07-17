import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { BoardMember, User } from "@prisma/client";

// ── Types ─────────────────────────────────────────────

export type BoardPermissions = {
  create_list: boolean;
  delete_card: boolean;
  assign_task: boolean;
  view_reports: boolean;
  manage_members: boolean;
};

export type MemberWithUser = BoardMember & { user: User };

// ── Get current session user ──────────────────────────

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

// ── Check global role ─────────────────────────────────

export function isSuperAdmin(user: User): boolean {
  return user.role === "super_admin";
}

export function isGlobalAdmin(user: User): boolean {
  return user.role === "super_admin" || user.role === "admin";
}

// ── Board membership helpers ──────────────────────────

export async function getBoardMember(boardId: string, userId: string) {
  return prisma.boardMember.findUnique({
    where: { board_id_user_id: { board_id: boardId, user_id: userId } },
    include: { user: true },
  });
}

export async function getBoardWithOwner(boardId: string) {
  return prisma.board.findUnique({
    where: { id: boardId },
    include: { owner: true },
  });
}

// ── Permission checks ─────────────────────────────────

/**
 * Returns true if the user can VIEW the board (any member or super admin)
 */
export async function canViewBoard(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  return !!member;
}

/**
 * Returns true if user can manage lists (create/edit/delete)
 */
export async function canManageLists(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  if (member.role === "admin") return true;

  const perms = member.permissions as Partial<BoardPermissions>;
  return perms.create_list === true;
}

/**
 * Returns true if user can create cards
 */
export async function canCreateCard(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  // Viewers cannot create cards
  return member.role !== "viewer";
}

/**
 * Returns true if user can delete cards
 */
export async function canDeleteCard(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  if (member.role === "admin") return true;

  const perms = member.permissions as Partial<BoardPermissions>;
  return perms.delete_card === true;
}

/**
 * Returns true if user can assign tasks
 */
export async function canAssignTasks(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  if (member.role === "viewer") return false;

  const perms = member.permissions as Partial<BoardPermissions>;
  return member.role === "admin" || member.role === "editor" || perms.assign_task === true;
}

/**
 * Returns true if user can manage board members
 */
export async function canManageMembers(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  return member.role === "admin";
}

/**
 * Returns true if user can view reports
 */
export async function canViewReports(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  if (!member) return false;

  if (member.role === "admin" || member.role === "editor") return true;

  const perms = member.permissions as Partial<BoardPermissions>;
  return perms.view_reports === true;
}

/**
 * Returns true if user can edit checklist templates for this board
 */
export async function canManageTemplates(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;

  const member = await getBoardMember(boardId, userId);
  return member?.role === "admin";
}

// ── API Route auth helper ─────────────────────────────

/**
 * Use in API routes to get the current user or throw 401
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Use in API routes to require super admin
 */
export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Use in API routes to require board membership
 */
export async function requireBoardMember(boardId: string) {
  const user = await requireAuth();
  const allowed = await canViewBoard(boardId, user.id, user.role);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ── Error response helpers ────────────────────────────

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function notFoundResponse(entity = "Resource") {
  return Response.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function serverErrorResponse(message = "Internal server error") {
  return Response.json({ error: message }, { status: 500 });
}

// ── Convenience alias ─────────────────────────────────

/**
 * Returns true if the user can manage (admin-level actions on) a board
 */
export async function canManageBoard(boardId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") return true;
  const member = await getBoardMember(boardId, userId);
  return member?.role === "admin";
}
