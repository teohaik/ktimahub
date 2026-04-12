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

  const role = session.user.role as Role;

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
