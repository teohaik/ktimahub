/**
 * Auth config WITHOUT the Prisma adapter — safe to import in Edge Runtime.
 * Used by middleware for JWT-only session checks.
 * The full config (with adapter) lives in src/auth.ts.
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Credentials provider stub — actual validation happens in src/auth.ts
    Credentials({ credentials: {} }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token }) {
      // roles and activeRole are written by the full auth.ts callback;
      // just pass the token through here.
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).roles = token.roles;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).activeRole = token.activeRole;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
