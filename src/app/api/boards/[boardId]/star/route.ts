import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse, serverErrorResponse, notFoundResponse } from "@/lib/permissions";

type Params = { params: Promise<{ boardId: string }> };

// POST /api/boards/[boardId]/star — Toggle board star state
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const user = await requireAuth();

    // Verify member exists
    const member = await prisma.boardMember.findFirst({
      where: { board_id: boardId, user_id: user.id },
    });
    if (!member) return forbiddenResponse();

    const body = await req.json();
    const { is_starred } = body;

    const updated = await prisma.boardMember.update({
      where: { id: member.id },
      data: { is_starred: !!is_starred },
    });

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[POST /api/boards/[boardId]/star]", error);
    return serverErrorResponse();
  }
}
