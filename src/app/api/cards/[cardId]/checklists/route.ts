import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canViewBoard, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { CreateChecklistItemSchema, ApplyTemplateSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// GET /api/cards/[cardId]/checklists
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const items = await prisma.checklistItem.findMany({
      where: { card_id: cardId },
      include: { checker: { select: { id: true, name: true } } },
      orderBy: { position: "asc" },
    });

    return Response.json({ data: items });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/cards/[cardId]/checklists — add item or apply template
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();

    // Apply template mode
    if (body.template_id) {
      const templateParsed = ApplyTemplateSchema.safeParse(body);
      if (!templateParsed.success)
        return Response.json({ error: templateParsed.error.flatten() }, { status: 400 });

      const template = await prisma.checklistTemplate.findUnique({
        where: { id: templateParsed.data.template_id },
      });
      if (!template) return notFoundResponse("Template");

      const templateItems = template.items as { id: string; text: string; order: number }[];

      // Get max position
      const lastItem = await prisma.checklistItem.findFirst({
        where: { card_id: cardId },
        orderBy: { position: "desc" },
      });
      let pos = (lastItem?.position ?? 0) + 1000;

      const items = await prisma.$transaction(
        templateItems.map((ti) => {
          const p = pos;
          pos += 1000;
          return prisma.checklistItem.create({
            data: {
              card_id: cardId,
              template_id: template.id,
              item_text: ti.text,
              position: p,
              is_checked: false,
            },
          });
        })
      );

      return Response.json({ data: items }, { status: 201 });
    }

    // Single item mode
    const parsed = CreateChecklistItemSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const lastItem = await prisma.checklistItem.findFirst({
      where: { card_id: cardId },
      orderBy: { position: "desc" },
    });
    const position = parsed.data.position ?? (lastItem ? lastItem.position + 1000 : 1000);

    const item = await prisma.checklistItem.create({
      data: {
        card_id: cardId,
        item_text: parsed.data.item_text,
        template_id: parsed.data.template_id,
        position,
        is_checked: false,
      },
    });

    return Response.json({ data: item }, { status: 201 });
  } catch (error) {
    return serverErrorResponse();
  }
}
