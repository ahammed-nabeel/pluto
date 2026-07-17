import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canCreateCard, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// POST /api/cards/[cardId]/duplicate
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const existing = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        tasks: true,
        checklistItems: true,
      },
    });
    if (!existing) return notFoundResponse("Card");

    const allowed = await canCreateCard(existing.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    // Get max position in same list
    const maxPosCard = await prisma.card.findFirst({
      where: { list_id: existing.list_id },
      orderBy: { position: "desc" },
    });
    const position = (maxPosCard?.position ?? 0) + 1000;

    // Create duplicate card
    const duplicated = await prisma.card.create({
      data: {
        board_id: existing.board_id,
        list_id: existing.list_id,
        project_name: `${existing.project_name} (Copy)`,
        product: existing.product,
        source: existing.source,
        description: existing.description,
        card_value: existing.card_value,
        label: existing.label,
        client_name: existing.client_name,
        contact_number: existing.contact_number,
        location_lat: existing.location_lat,
        location_lng: existing.location_lng,
        location_address: existing.location_address,
        card_owner_id: existing.card_owner_id,
        created_by: user.id,
        position,
        tags: existing.tags,
        cover_image_url: existing.cover_image_url,
        tasks: {
          create: existing.tasks.map((t) => ({
            title: t.title,
            description: t.description,
            priority: t.priority,
            due_date: t.due_date,
            created_by: user.id,
            status: "pending",
          })),
        },
        checklistItems: {
          create: existing.checklistItems.map((ci) => ({
            item_text: ci.item_text,
            is_checked: false,
            position: ci.position,
          })),
        },
      },
    });

    await logActivity({
      boardId: existing.board_id,
      cardId: duplicated.id,
      action: `Duplicated card '${existing.project_name}'`,
      actionType: ActivityTypes.CARD_CREATED,
      performedBy: user.id,
    });

    return Response.json({ data: duplicated }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cards/[cardId]/duplicate]", error);
    return serverErrorResponse();
  }
}
