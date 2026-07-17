import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, name, password } = await req.json();
    if (!email || !code || !name || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify code
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: code
      }
    });

    if (!tokenRecord) {
      return Response.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date() > tokenRecord.expires) {
      // Clean up expired code
      await prisma.verificationToken.deleteMany({
        where: { identifier: cleanEmail }
      });
      return Response.json({ error: "Verification code expired" }, { status: 400 });
    }

    // Code is valid! Delete the token so it cannot be reused
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail }
    });

    // 2. Hash password
    const salt = bcryptjs.genSaltSync(10);
    const passwordHash = bcryptjs.hashSync(password, salt);

    // 3. Create user in database
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        password_hash: passwordHash,
        auth_provider: "credentials",
        role: "member",
        status: "active"
      }
    });

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("[POST /api/auth/signup/complete]", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
