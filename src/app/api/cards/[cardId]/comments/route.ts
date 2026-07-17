import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canViewBoard, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ cardId: string }> };

const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000),
});

// GET /api/cards/[cardId]/comments
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const comments = await prisma.cardComment.findMany({
      where: { card_id: cardId },
      include: {
        creator: { select: { id: true, name: true, profile_picture_url: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return Response.json({ data: comments });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/cards/[cardId]/comments
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const comment = await prisma.cardComment.create({
      data: {
        card_id: cardId,
        content: parsed.data.content,
        created_by: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    return Response.json({ data: comment }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}
