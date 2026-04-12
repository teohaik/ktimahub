import AppShell from "@/components/layout/AppShell";

export default async function LeaseholderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <AppShell locale={locale} allowedRoles={["LEASEHOLDER"]}>
      {children}
    </AppShell>
  );
}
