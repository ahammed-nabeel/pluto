import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback_secret_for_dev";

export async function POST(req: Request) {
  try {
    const { provider, token } = await req.json();

    if (!provider || !token) {
      return NextResponse.json({ error: "Missing provider or token" }, { status: 400 });
    }

    let email: string | undefined;
    let name: string | undefined;
    let image: string | undefined;

    if (provider === "google") {
      // Verify Google ID Token
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      const payload = await response.json();

      if (!response.ok || !payload.email) {
        console.error("Google token verification failed:", payload);
        return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
      }

      email = payload.email;
      name = payload.name;
      image = payload.picture;

      // Note: In a production environment, you should also verify that 
      // payload.aud matches one of your expected Google Client IDs.
    } 
    else if (provider === "microsoft") {
      // Verify Microsoft Access Token by fetching the user profile
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();

      if (!response.ok || (!payload.mail && !payload.userPrincipalName)) {
        console.error("Microsoft token verification failed:", payload);
        return NextResponse.json({ error: "Invalid Microsoft token" }, { status: 401 });
      }

      email = payload.mail || payload.userPrincipalName;
      name = payload.displayName;
      // Microsoft profile picture requires a separate Graph API call, skip for now.
    } 
    else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email not found in token" }, { status: 400 });
    }

    // Find or create the user in the database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          profile_picture_url: image,
          role: "user",
          status: "active",
        },
      });
      
      // Also link the account for NextAuth compatibility if they log in via Web later
      // We'd ideally need the provider's 'sub' or 'id', but we can skip creating an Account
      // record here as NextAuth handles linking by email if the user logs in via Web later.
    }

    // Generate our custom mobile JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.profile_picture_url
      }
    });

  } catch (error) {
    console.error("Mobile OAuth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
