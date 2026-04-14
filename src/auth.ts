import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign-in OR when the token pre-dates the roles field (stale JWT):
      // load roles from DB
      if (user || !token.roles) {
        const id = (user?.id ?? token.id) as string;
        const dbUser = await db.user.findUnique({
          where: { id },
          select: { roles: true },
        });
        let roles = (dbUser?.roles ?? []) as Role[];

        // New Google sign-up with no roles → default to LAND_OWNER
        if (user && roles.length === 0) {
          await db.user.update({
            where: { id },
            data: { roles: ["LAND_OWNER"], status: "ACTIVE" },
          });
          roles = ["LAND_OWNER"] as Role[];
        }

        if (user) token.id = user.id!;
        token.roles = roles;
        // Preserve an already-selected activeRole on re-hydration;
        // auto-select only on fresh sign-in or if the token had none.
        if (!token.activeRole) {
          token.activeRole = roles.length === 1 ? roles[0] : null;
        }
      }

      // On session update: set or clear activeRole
      if (trigger === "update" && "activeRole" in (session ?? {})) {
        const requested = session.activeRole as Role | null;
        if (requested === null) {
          token.activeRole = null;
        } else if ((token.roles as Role[]).includes(requested)) {
          token.activeRole = requested;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as Role[];
        session.user.activeRole = token.activeRole as Role | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
