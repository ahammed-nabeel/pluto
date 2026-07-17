import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";

// POST /api/cron/tasks — update overdue task statuses
// Call this via cron scheduler (Vercel Cron, external cron, etc.)
// Protected by CRON_SECRET header
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.task.updateMany({
      where: {
        status: { in: ["pending", "in_progress"] },
        due_date: { lt: now },
      },
      data: { status: "overdue" },
    });

    console.log(`[Cron] Marked ${result.count} tasks as overdue`);
    return Response.json({ data: { updated: result.count, timestamp: now.toISOString() } });
  } catch (error) {
    console.error("[Cron /api/cron/tasks]", error);
    return serverErrorResponse();
  }
}

// GET — for manual trigger in dev
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not allowed in production" }, { status: 403 });
  }
  return POST(req);
}
