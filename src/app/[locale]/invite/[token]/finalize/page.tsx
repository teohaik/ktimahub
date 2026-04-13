import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string; token: string }> };

/**
 * Landing page after Google OAuth on the invite flow.
 * The user is now signed in — we assign the invited roles and mark the invite used.
 */
export default async function InviteFinalizePage({ params }: Props) {
  const { locale, token } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const invite = await db.invite.findUnique({ where: { token } });

  // Validate invite
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    redirect(`/${locale}/invite/${token}`); // will show invalid state
  }

  // Emails must match
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect(`/${locale}/invite/${token}`);
  }

  // Merge roles into user and mark invite used
  const existing = await db.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (existing) {
    const merged = Array.from(
      new Set([...existing.roles, ...(invite.roles as string[])])
    );
    await db.user.update({
      where: { id: session.user.id },
      data: { roles: merged as never },
    });
  }

  await db.invite.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  // Force JWT refresh on next request by redirecting through sign-in flow
  redirect(`/${locale}`);
}
