import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  canViewBoard,
  canCreateCard,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/permissions";
import { CreateCardSchema } from "@/lib/validations";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

// GET /api/boards/[boardId]/cards
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canViewBoard(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const { searchParams } = req.nextUrl;
    const listId = searchParams.get("listId");

    const cards = await prisma.card.findMany({
      where: {
        board_id: boardId,
        ...(listId ? { list_id: listId } : {}),
      },
      include: {
        cardOwner: { select: { id: true, name: true, profile_picture_url: true } },
        _count: { select: { tasks: true, checklistItems: true, attachments: true } },
      },
      orderBy: [{ list_id: "asc" }, { position: "asc" }],
    });

    return Response.json({ data: cards });
  } catch (error) {
    return serverErrorResponse();
  }
}

// POST /api/boards/[boardId]/cards
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    const allowed = await canCreateCard(boardId, user.id, user.role);
    if (!allowed) return forbiddenResponse();

    const body = await req.json();
    const parsed = CreateCardSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    // Verify list belongs to this board
    const list = await prisma.list.findFirst({
      where: { id: parsed.data.list_id, board_id: boardId },
    });
    if (!list) return Response.json({ error: "List not found in this board" }, { status: 404 });

    // Validate list-specific mandatory fields
    if (list.mandatory_fields && list.mandatory_fields.length > 0) {
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

      for (const field of list.mandatory_fields) {
        const value = (parsed.data as any)[field];
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
          return Response.json({
            error: {
              message: `The field "${fieldLabels[field] || field}" is mandatory for this list/stage.`
            }
          }, { status: 400 });
        }
      }
    }

    // Get max position within the list
    const last = await prisma.card.findFirst({
      where: { list_id: parsed.data.list_id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = parsed.data.position ?? (last ? last.position + 1000 : 1000);

    const card = await prisma.card.create({
      data: {
        ...parsed.data,
        board_id: boardId,
        created_by: user.id,
        card_owner_id: parsed.data.card_owner_id ?? user.id,
        position,
        card_value: parsed.data.card_value ? parsed.data.card_value : null,
      },
      include: {
        cardOwner: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    await logActivity({
      boardId,
      cardId: card.id,
      action: `Created card '${card.project_name}'`,
      actionType: ActivityTypes.CARD_CREATED,
      performedBy: user.id,
    });

    return Response.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/boards/[boardId]/cards]", error);
    return serverErrorResponse();
  }
}
