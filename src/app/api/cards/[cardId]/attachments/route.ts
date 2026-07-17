import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";
import { uploadFile } from "@/lib/storage";
import { detectFileType } from "@/lib/utils";
import { logActivity, ActivityTypes } from "@/lib/activity";

type Params = { params: Promise<{ cardId: string }> };

// POST /api/cards/[cardId]/attachments — upload file
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const user = await requireAuth();

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return Response.json({ error: "Card not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const isCameraCapture = formData.get("camera_capture") === "true";

    // Upload file using storage abstraction
    const uploaded = await uploadFile(file);

    let fileType: "image" | "video" | "document" | "camera_capture";
    if (isCameraCapture) {
      fileType = "camera_capture";
    } else {
      fileType = detectFileType(uploaded.mimeType);
    }

    const attachment = await prisma.attachment.create({
      data: {
        card_id: cardId,
        file_url: uploaded.url,
        file_name: uploaded.fileName,
        file_size: uploaded.fileSize,
        file_type: fileType,
        mime_type: uploaded.mimeType,
        uploaded_by: user.id,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    // Check and set as default cover if card has no cover image yet and this is an image file
    if ((fileType === "image" || uploaded.mimeType.startsWith("image/")) && !card.cover_image_url) {
      await prisma.card.update({
        where: { id: cardId },
        data: { cover_image_url: uploaded.url },
      });
    }

    await logActivity({
      boardId: card.board_id,
      cardId: card.id,
      action: `Uploaded attachment '${file.name}'`,
      actionType: ActivityTypes.ATTACHMENT_UPLOADED,
      performedBy: user.id,
    });

    return Response.json({ data: attachment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cards/[cardId]/attachments]", error);
    if (error instanceof Error && (error.message.includes("File size") || error.message.includes("not allowed"))) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return serverErrorResponse();
  }
}

// DELETE /api/cards/[cardId]/attachments?id=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { cardId } = await params;
    const attachmentId = req.nextUrl.searchParams.get("id");

    if (!attachmentId) return Response.json({ error: "id required" }, { status: 400 });

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, card_id: cardId },
    });
    if (!attachment) return Response.json({ error: "Not found" }, { status: 404 });

    // Delete from storage
    const { deleteFile } = await import("@/lib/storage");
    const key = attachment.file_url.split("/").pop() ?? "";
    await deleteFile(key).catch(() => {}); // Non-fatal

    await prisma.attachment.delete({ where: { id: attachmentId } });
    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverErrorResponse();
  }
}
