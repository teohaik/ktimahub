import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "./Navbar";
import type { Role } from "@/generated/prisma/client";

interface AppShellProps {
  children: React.ReactNode;
  locale: string;
  allowedRoles?: Role[];
}

export default async function AppShell({
  children,
  locale,
  allowedRoles,
}: AppShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.user.role as Role} userName={session.user.name} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
