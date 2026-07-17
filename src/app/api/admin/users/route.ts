import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, serverErrorResponse } from "@/lib/permissions";
import { UpdateUserStatusSchema } from "@/lib/validations";

// GET /api/admin/users — super admin: list all users
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    const users = await prisma.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status ? { status: status as "active" | "suspended" } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        auth_provider: true,
        profile_picture_url: true,
        created_at: true,
        last_login: true,
        _count: { select: { ownedBoards: true, boardMemberships: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.user.count({
      where: {
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
        ...(status ? { status: status as "active" | "suspended" } : {}),
      },
    });

    return Response.json({ data: { users, total, page, limit } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN")
      return Response.json({ error: "Forbidden — super admin only" }, { status: 403 });
    return serverErrorResponse();
  }
}

// PATCH /api/admin/users?userId=xxx — update user status
export async function PATCH(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateUserStatusSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: parsed.data.status },
      select: { id: true, name: true, email: true, status: true },
    });

    return Response.json({ data: user });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    return serverErrorResponse();
  }
}
