import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { GlobalRole } from "@prisma/client";
import bcryptjs from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase().trim() }
        });
        
        if (!user || !user.password_hash) return null;
        
        const pwMatch = bcryptjs.compareSync(credentials.password as string, user.password_hash);
        if (!pwMatch) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.profile_picture_url,
          role: user.role,
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user.email) {
        if (account?.provider === "credentials") {
          await prisma.user.update({
            where: { email: user.email },
            data: { last_login: new Date() }
          });
          return true;
        }
        const provider = account?.provider === "google" ? "google" : "microsoft";
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            last_login: new Date(),
            auth_provider: provider,
            profile_picture_url: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? user.email,
            auth_provider: provider,
            profile_picture_url: user.image,
            role: "member",
            status: "active",
            last_login: new Date(),
          },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign-in, fetch full user data
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as GlobalRole;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Cleanup if needed
    },
  },
});

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: GlobalRole;
      status: string;
    };
  }
}
