import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const roles = session.user.roles ?? [];
  const activeRole = session.user.activeRole ?? null;

  // If the user has multiple roles and hasn't picked one yet, ask them
  if (!activeRole && roles.length > 1) {
    redirect(`/${locale}/select-role`);
  }

  const role = (activeRole ?? roles[0]) as Role;

  switch (role) {
    case "SUPER_ADMIN":
      redirect(`/${locale}/users`);
    case "LAND_OWNER":
      redirect(`/${locale}/fields`);
    case "LEASEHOLDER":
      redirect(`/${locale}/my-fields`);
    default:
      redirect(`/${locale}/login`);
  }
}
