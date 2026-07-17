import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ attachmentId: string }> };

const RenameAttachmentSchema = z.object({
  file_name: z.string().min(1, "File name is required").max(255),
});

// PATCH /api/attachments/[attachmentId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { attachmentId } = await params;
    const user = await requireAuth();

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { card: { select: { board_id: true } } },
    });
    if (!attachment) return notFoundResponse("Attachment");

    // Verify user can edit cards on this board
    const boardMember = await prisma.boardMember.findFirst({
      where: {
        board_id: attachment.card.board_id,
        user_id: user.id,
      },
    });

    if (user.role !== "super_admin" && !boardMember) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const parsed = RenameAttachmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: { file_name: parsed.data.file_name },
    });

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/attachments/[attachmentId]]", error);
    return serverErrorResponse();
  }
}
