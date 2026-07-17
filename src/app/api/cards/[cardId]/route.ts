import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  canViewBoard,
  canCreateCard,
  canDeleteCard,
  forbiddenResponse,
  serverErrorResponse,
  notFoundResponse,
} from "@/lib/permissions";
import { UpdateCardSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// GET /api/cards/[cardId] — full card detail
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        cardOwner: { select: { id: true, name: true, email: true, profile_picture_url: true } },
        creator: { select: { id: true, name: true, email: true, profile_picture_url: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, profile_picture_url: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "asc" },
        },
        checklistItems: {
          include: {
            checker: { select: { id: true, name: true } },
          },
          orderBy: { position: "asc" },
        },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { uploaded_at: "desc" },
        },
        activityLogs: {
          include: {
            performer: { select: { id: true, name: true, profile_picture_url: true } },
          },
          orderBy: { timestamp: "desc" },
          take: 50,
        },
        list: { select: { id: true, title: true } },
      },
    });

    if (!card) return notFoundResponse("Card");

    const allowed = await canViewBoard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    return Response.json({ data: card });
  } catch (error) {
    return serverErrorResponse();
  }
}

// PATCH /api/cards/[cardId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const existing = await prisma.card.findUnique({ where: { id: cardId } });
    if (!existing) return notFoundResponse("Card");

    const allowed = await canCreateCard(existing.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = UpdateCardSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        project_name: parsed.data.project_name,
        product: parsed.data.product === "" ? null : parsed.data.product,
        source: (parsed.data.source as any) === "" ? null : parsed.data.source,
        description: parsed.data.description === "" ? null : parsed.data.description,
        card_value: parsed.data.card_value !== undefined ? parsed.data.card_value : undefined,
        label: (parsed.data.label as any) === "" ? null : parsed.data.label,
        card_owner_id: parsed.data.card_owner_id === "" ? null : parsed.data.card_owner_id,
        tags: parsed.data.tags,
        cover_image_url: parsed.data.cover_image_url === "" ? null : parsed.data.cover_image_url,
        client_name: parsed.data.client_name === "" ? null : parsed.data.client_name,
        contact_number: parsed.data.contact_number === "" ? null : parsed.data.contact_number,
        location_lat: parsed.data.location_lat !== undefined ? parsed.data.location_lat : undefined,
        location_lng: parsed.data.location_lng !== undefined ? parsed.data.location_lng : undefined,
        location_address: parsed.data.location_address === "" ? null : parsed.data.location_address,
        is_archived: parsed.data.is_archived !== undefined ? parsed.data.is_archived : undefined,
      },
    });

    await logActivity({
      boardId: card.board_id,
      cardId: card.id,
      action: `Updated card '${card.project_name}'`,
      actionType: ActivityTypes.CARD_UPDATED,
      performedBy: user.id,
    });

    return Response.json({ data: card });
  } catch (error) {
    return serverErrorResponse();
  }
}

// DELETE /api/cards/[cardId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return notFoundResponse("Card");

    const allowed = await canDeleteCard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    await prisma.card.delete({ where: { id: cardId } });

    await logActivity({
      boardId: card.board_id,
      action: `Deleted card '${card.project_name}'`,
      actionType: ActivityTypes.CARD_DELETED,
      performedBy: user.id,
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
