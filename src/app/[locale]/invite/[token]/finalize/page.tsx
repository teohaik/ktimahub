import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string; token: string }> };

/**
 * Landing page after Google OAuth on the invite flow.
 * The PrismaAdapter already linked the Google account to the pre-created
 * INVITED user (matched by email). We just set status = ACTIVE here.
 */
export default async function InviteFinalizePage({ params }: Props) {
  const { locale, token } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    redirect(`/${locale}/invite/${token}`);
  }

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect(`/${locale}/invite/${token}`);
  }

  // Fetch current user to check if name needs to be set from Google profile
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: {
      status: "ACTIVE",
      // Populate name from Google profile if not yet set
      ...(session.user.name && !dbUser?.name ? { name: session.user.name } : {}),
    },
  });

  await db.invite.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  redirect(`/${locale}`);
}
