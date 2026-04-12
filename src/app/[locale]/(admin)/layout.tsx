import AppShell from "@/components/layout/AppShell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <AppShell locale={locale} allowedRoles={["SUPER_ADMIN"]}>
      {children}
    </AppShell>
  );
}
