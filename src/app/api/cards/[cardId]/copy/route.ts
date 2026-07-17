import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canCreateCard, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// POST /api/cards/[cardId]/copy
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

    const body = await req.json();
    const { target_board_id, target_list_id, action_type } = body; // action_type: "copy" | "move" | "mirror"

    if (!target_board_id || !target_list_id) {
      return Response.json({ error: "target_board_id and target_list_id are required" }, { status: 400 });
    }

    // Verify permission on target board
    const allowed = await canCreateCard(target_board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    // Verify target list and check mandatory fields
    const targetList = await prisma.list.findFirst({
      where: { id: target_list_id, board_id: target_board_id },
    });
    if (!targetList) return Response.json({ error: "Target list not found" }, { status: 404 });

    if (targetList.mandatory_fields && targetList.mandatory_fields.length > 0) {
      const fieldLabels: Record<string, string> = {
        project_name: "Project Name",
        product: "Product",
        source: "Source",
        description: "Description",
        card_value: "Value",
        label: "Label",
        client_name: "Client Name",
        contact_number: "Contact Number",
        location_address: "Address",
        card_owner_id: "Owner",
      };

      for (const field of targetList.mandatory_fields) {
        const value = (existing as any)[field];
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
          return Response.json({
            error: `Cannot ${action_type} card. The field "${fieldLabels[field] || field}" is mandatory for "${targetList.title}" stage.`
          }, { status: 400 });
        }
      }
    }

    // Get max position in target list
    const maxPosCard = await prisma.card.findFirst({
      where: { list_id: target_list_id },
      orderBy: { position: "desc" },
    });
    const position = (maxPosCard?.position ?? 0) + 1000;

    let targetCard;

    if (action_type === "move") {
      // Move card to other board/list
      targetCard = await prisma.card.update({
        where: { id: cardId },
        data: {
          board_id: target_board_id,
          list_id: target_list_id,
          position,
        },
      });

      await logActivity({
        boardId: existing.board_id,
        cardId: cardId,
        action: `Moved card '${existing.project_name}' to another board`,
        actionType: ActivityTypes.CARD_MOVED,
        performedBy: user.id,
      });
    } else {
      // Copy or Mirror (indicator flag or reference copy)
      const labelPrefix = action_type === "mirror" ? "[Mirrored] " : "";
      targetCard = await prisma.card.create({
        data: {
          board_id: target_board_id,
          list_id: target_list_id,
          project_name: `${labelPrefix}${existing.project_name}`,
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
        boardId: target_board_id,
        cardId: targetCard.id,
        action: `${action_type === "mirror" ? "Mirrored" : "Copied"} card '${existing.project_name}' from another board`,
        actionType: ActivityTypes.CARD_CREATED,
        performedBy: user.id,
      });
    }

    return Response.json({ data: targetCard });
  } catch (error) {
    console.error("[POST /api/cards/[cardId]/copy]", error);
    return serverErrorResponse();
  }
}
