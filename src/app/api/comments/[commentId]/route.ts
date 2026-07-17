import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ commentId: string }> };

const UpdateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000),
});

// PATCH /api/comments/[commentId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;
    const user = await requireAuth();

    const comment = await prisma.cardComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) return notFoundResponse("Comment");

    // Enforce owner-only edit security
    if (comment.created_by !== user.id) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const parsed = UpdateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.cardComment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
      include: {
        creator: { select: { id: true, name: true, profile_picture_url: true } },
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/comments/[commentId]]", error);
    return serverErrorResponse();
  }
}

// DELETE /api/comments/[commentId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;
    const user = await requireAuth();

    const comment = await prisma.cardComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) return notFoundResponse("Comment");

    // Enforce owner-only delete security
    if (comment.created_by !== user.id) {
      return forbiddenResponse();
    }

    await prisma.cardComment.delete({
      where: { id: commentId },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error("[DELETE /api/comments/[commentId]]", error);
    return serverErrorResponse();
  }
}
