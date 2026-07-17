import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";
import { CreateBoardSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

// GET /api/boards — list all boards the current user is a member of
export async function GET() {
  try {
    const user = await requireAuth();

    const where =
      user.role === "super_admin"
        ? { is_archived: false }
        : { is_archived: false, members: { some: { user_id: user.id } } };

    const boards = await prisma.board.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, profile_picture_url: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, profile_picture_url: true } },
          },
        },
        _count: { select: { lists: true, cards: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const mapped = boards.map((b) => {
      const myMembership = b.members.find((m) => m.user_id === user.id);
      return {
        ...b,
        is_starred: myMembership?.is_starred ?? false,
        my_role: myMembership?.role ?? null,
      };
    });

    return Response.json({ data: mapped });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[GET /api/boards]", error);
    return serverErrorResponse();
  }
}

// POST /api/boards — create a new board
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = CreateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, description, settings } = parsed.data;

    // Generate url-friendly slug
    const cleanSlug = name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
    const slug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Transaction: create board + add creator as admin member
    const board = await prisma.$transaction(async (tx) => {
      const b = await tx.board.create({
        data: {
          name,
          slug,
          description,
          owner_id: user.id,
          settings: settings ? (settings as any) : {},
        },
      });

      // Creator automatically becomes board admin
      await tx.boardMember.create({
        data: {
          board_id: b.id,
          user_id: user.id,
          role: "admin",
          permissions: {
            create_list: true,
            delete_card: true,
            assign_task: true,
            view_reports: true,
            manage_members: true,
          },
        },
      });

      return b;
    });

    await logActivity({
      boardId: board.id,
      action: `Created board '${board.name}'`,
      actionType: ActivityTypes.BOARD_CREATED,
      performedBy: user.id,
    });

    return Response.json({ data: board }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[POST /api/boards]", error);
    return serverErrorResponse();
  }
}
