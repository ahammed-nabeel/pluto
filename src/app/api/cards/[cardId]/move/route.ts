import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canViewBoard, canCreateCard, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { MoveCardSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// POST /api/cards/[cardId]/move — move card to different list or reposition
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: true },
    });
    if (!card) return notFoundResponse("Card");

    const allowed = await canCreateCard(card.board_id, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = MoveCardSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const { list_id, position } = parsed.data;

    // Verify target list is on same board
    const targetList = await prisma.list.findFirst({
      where: { id: list_id, board_id: card.board_id },
    });
    if (!targetList) return notFoundResponse("Target list");

    // Validate target list mandatory fields against card values
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
        const value = (card as any)[field];
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
          return Response.json({
            error: `Cannot move card. The field "${fieldLabels[field] || field}" is mandatory for "${targetList.title}" stage.`
          }, { status: 400 });
        }
      }
    }

    const moved = await prisma.card.update({
      where: { id: cardId },
      data: { list_id, position },
    });

    // Log if moved to different list
    if (list_id !== card.list_id) {
      await logActivity({
        boardId: card.board_id,
        cardId: card.id,
        action: `Moved '${card.project_name}' from '${card.list.title}' to '${targetList.title}'`,
        actionType: ActivityTypes.CARD_MOVED,
        performedBy: user.id,
        metadata: { from_list: card.list_id, to_list: list_id, from_title: card.list.title, to_title: targetList.title },
      });
    }

    return Response.json({ data: moved });
  } catch (error) {
    return serverErrorResponse();
  }
}
