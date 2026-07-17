import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, auth_provider: true, password_hash: true }
    });

    if (!user) {
      return Response.json({ exists: false });
    }

    return Response.json({
      exists: true,
      provider: user.auth_provider,
      hasPassword: !!user.password_hash
    });
  } catch (error) {
    console.error("[POST /api/auth/check-email]", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
