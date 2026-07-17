import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });
    if (user) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    // Generate random 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Save to database verification tokens
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: cleanEmail,
          token: code
        }
      },
      update: { expires },
      create: {
        identifier: cleanEmail,
        token: code,
        expires
      }
    });

    console.log(`[VERIFICATION CODE FOR ${cleanEmail}]: ${code}`);

    // Return code in response for testing/demo purposes
    return Response.json({ success: true, code });
  } catch (error) {
    console.error("[POST /api/auth/signup/send-code]", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
