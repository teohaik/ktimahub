import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import type { Role } from "@/generated/prisma/client";
import Link from "next/link";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // Authenticated users → role-based redirect
  if (session?.user) {
    const roles = session.user.roles ?? [];
    const activeRole = session.user.activeRole ?? null;

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

  // Unauthenticated → show landing page
  const t = await getTranslations();

  return <LandingPage locale={locale} t={t} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function LandingPage({ locale, t }: { locale: string; t: any }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

  const features = [
    {
      icon: <SatelliteIcon />,
      title: t("landing.f1Title"),
      desc: t("landing.f1Desc"),
      color: "bg-green-50 text-green-700",
    },
    {
      icon: <CropIcon />,
      title: t("landing.f2Title"),
      desc: t("landing.f2Desc"),
      color: "bg-amber-50 text-amber-700",
    },
    {
      icon: <PeopleIcon />,
      title: t("landing.f3Title"),
      desc: t("landing.f3Desc"),
      color: "bg-blue-50 text-blue-700",
    },
    {
      icon: <ReportIcon />,
      title: t("landing.f4Title"),
      desc: t("landing.f4Desc"),
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">KtimaHub</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t("landing.cta")}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-green-950 text-white">
        {/* decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[320px] h-[320px] rounded-full bg-green-900/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-3xl" />
        </div>

        {/* wheat pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "18px 18px" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-36 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-green-200 text-xs font-medium tracking-wide uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t("landing.heroLabel")}
          </span>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
            Ktima<span className="text-green-300">Hub</span>
          </h1>

          <p className="text-xl sm:text-2xl text-green-100 font-medium max-w-xl mb-4">
            {t("landing.tagline")}
          </p>
          <p className="text-green-200/80 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-green-800 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-lg shadow-green-900/20 text-base"
            >
              {t("landing.cta")} →
            </Link>
          </div>

          {/* hero stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 sm:gap-12 text-center">
            {[
              { val: "ΕΓΣΑ87", label: locale === "el" ? "Συντεταγμένες" : "Coordinates" },
              { val: "PDF", label: locale === "el" ? "Εκτυπώσεις" : "Reports" },
              { val: "2", label: locale === "el" ? "Γλώσσες" : "Languages" },
            ].map((s) => (
              <div key={s.val}>
                <div className="text-2xl sm:text-3xl font-bold text-white">{s.val}</div>
                <div className="text-green-300 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="py-16 bg-green-700 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-4xl mb-4">🌾</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("landing.trustedBy")}</h2>
          <p className="text-green-200 mb-7 text-sm sm:text-base">
            {t("landing.subtitle")}
          </p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-green-800 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-lg text-base"
          >
            {t("landing.cta")} →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🌾</span>
            <span className="font-semibold text-gray-300">KtimaHub</span>
            {version && <span className="text-gray-600">v{version}</span>}
          </div>
          <span>© 2026 Theodore Chaikalis</span>
        </div>
      </footer>
    </div>
  );
}

function SatelliteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  );
}
function CropIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22V12"/><path d="M5 3C5 3 5 13 12 13C19 13 19 3 19 3"/><path d="M5 12C5 12 5 22 12 22C19 22 19 12 19 12"/>
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
