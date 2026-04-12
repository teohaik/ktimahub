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

  const activeRole = session.user.activeRole as Role | null;

  if (allowedRoles && (!activeRole || !allowedRoles.includes(activeRole))) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={activeRole as Role} userName={session.user.name} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-400">
          <span>© 2026 Theodore Chaikalis</span>
          <span>v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.2.0"}</span>
        </div>
      </footer>
    </div>
  );
}
