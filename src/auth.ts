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
      // On sign-in: load roles from DB
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { roles: true },
        });
        const roles = (dbUser?.roles ?? ["LEASEHOLDER"]) as Role[];
        token.id = user.id!;
        token.roles = roles;
        // Auto-select if only one role; otherwise require explicit selection
        token.activeRole = roles.length === 1 ? roles[0] : null;
      }

      // On session update (role selection): validate and store chosen role
      if (trigger === "update" && session?.activeRole) {
        const requested = session.activeRole as Role;
        if ((token.roles as Role[]).includes(requested)) {
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
