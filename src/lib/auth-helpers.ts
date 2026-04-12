import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

/**
 * Server-side helper — gets session or redirects to login.
 * Use at the top of any Server Component that requires auth.
 */
export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }
  return session;
}

/**
 * Server-side helper — gets session and enforces a specific role.
 * Checks activeRole (the role the user selected at login).
 * Redirects to login if not authenticated, or to home if wrong role.
 */
export async function requireRole(locale: string, ...roles: Role[]) {
  const session = await requireAuth(locale);
  const active = session.user.activeRole as Role | null;
  if (!active || !roles.includes(active)) {
    redirect(`/${locale}`);
  }
  return session;
}
