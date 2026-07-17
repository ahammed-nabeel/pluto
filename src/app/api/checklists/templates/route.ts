import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";
import { CreateTemplateSchema } from "@/lib/validations";

// GET /api/checklists/templates?boardId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const boardId = req.nextUrl.searchParams.get("boardId");

    const templates = await prisma.checklistTemplate.findMany({
      where: {
        OR: [
          { board_id: null }, // global templates
          ...(boardId ? [{ board_id: boardId }] : []),
        ],
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return Response.json({ data: templates });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/checklists/templates
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = CreateTemplateSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    // Global templates only for super admin
    if (!parsed.data.board_id && user.role !== "super_admin") {
      return Response.json({ error: "Only super admin can create global templates" }, { status: 403 });
    }

    const template = await prisma.checklistTemplate.create({
      data: {
        name: parsed.data.name,
        board_id: parsed.data.board_id ?? null,
        items: parsed.data.items,
        created_by: user.id,
      },
    });

    return Response.json({ data: template }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}
