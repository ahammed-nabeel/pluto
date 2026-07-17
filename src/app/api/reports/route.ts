import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";
import { ReportFilterSchema } from "@/lib/validations";

// GET /api/reports — filterable report data
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = req.nextUrl;

    const rawFilters = {
      board_id: searchParams.get("board_id") ?? undefined,
      user_id: searchParams.get("user_id") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      label: searchParams.get("label") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      product: searchParams.get("product") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const parsed = ReportFilterSchema.safeParse(rawFilters);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const filters = parsed.data;

    // Build board access filter
    const accessibleBoards = user.role === "super_admin"
      ? undefined
      : { members: { some: { user_id: user.id } } };

    const cards = await prisma.card.findMany({
      where: {
        ...(filters.board_id ? { board_id: filters.board_id } : {}),
        ...(accessibleBoards && !filters.board_id ? { board: accessibleBoards } : {}),
        ...(filters.label ? { label: filters.label } : {}),
        ...(filters.source ? { source: filters.source } : {}),
        ...(filters.product ? { product: { contains: filters.product, mode: "insensitive" } } : {}),
        ...(filters.search
          ? {
              OR: [
                { project_name: { contains: filters.search, mode: "insensitive" } },
                { client_name: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(filters.date_from || filters.date_to
          ? {
              created_at: {
                ...(filters.date_from ? { gte: new Date(filters.date_from) } : {}),
                ...(filters.date_to ? { lte: new Date(filters.date_to) } : {}),
              },
            }
          : {}),
      },
      include: {
        list: { select: { id: true, title: true } },
        board: { select: { id: true, name: true } },
        cardOwner: { select: { id: true, name: true } },
        _count: { select: { tasks: true, checklistItems: true, attachments: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return Response.json({ data: cards });
  } catch (error) {
    console.error("[GET /api/reports]", error);
    return serverErrorResponse();
  }
}
