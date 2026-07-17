import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverErrorResponse } from "@/lib/permissions";
import { UpdateProfileSchema } from "@/lib/validations";
import bcryptjs from "bcryptjs";

// GET /api/profile
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        auth_provider: true,
        profile_picture_url: true,
        created_at: true,
        last_login: true,
        password_hash: true,
        _count: { select: { ownedBoards: true, boardMemberships: true } },
      },
    });

    if (!profile) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { password_hash, ...rest } = profile;

    return Response.json({ 
      data: {
        ...rest,
        hasPassword: !!password_hash
      } 
    });
  } catch (error) {
    return serverErrorResponse();
  }
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await req.json();

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {
      name: parsed.data.name,
      profile_picture_url: parsed.data.profile_picture_url || null,
    };

    // If trying to set/change password
    if (parsed.data.newPassword) {
      const hasPassword = !!dbUser.password_hash;
      
      if (hasPassword) {
        if (!parsed.data.oldPassword) {
          return Response.json({ error: "Current password is required to change password" }, { status: 400 });
        }
        const pwMatch = bcryptjs.compareSync(parsed.data.oldPassword, dbUser.password_hash!);
        if (!pwMatch) {
          return Response.json({ error: "Incorrect current password" }, { status: 400 });
        }
      }

      // Hash and save new password
      const salt = bcryptjs.genSaltSync(10);
      updateData.password_hash = bcryptjs.hashSync(parsed.data.newPassword, salt);
      updateData.auth_provider = "credentials";
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profile_picture_url: true,
        role: true,
        auth_provider: true,
        password_hash: true
      },
    });

    const { password_hash, ...rest } = updated;

    return Response.json({ 
      data: {
        ...rest,
        hasPassword: !!password_hash
      } 
    });
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return serverErrorResponse();
  }
}
