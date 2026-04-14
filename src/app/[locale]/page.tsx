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

  const t = await getTranslations();

  return <LandingPage locale={locale} t={t} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function LandingPage({ locale, t }: { locale: string; t: any }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

  const features = [
    {
      icon: <MapPinIcon />,
      title: t("landing.f1Title"),
      desc: t("landing.f1Desc"),
      accent: "bg-green-50 text-green-700 ring-green-100",
    },
    {
      icon: <SproutIcon />,
      title: t("landing.f2Title"),
      desc: t("landing.f2Desc"),
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      icon: <UsersIcon />,
      title: t("landing.f3Title"),
      desc: t("landing.f3Desc"),
      accent: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      icon: <DocumentIcon />,
      title: t("landing.f4Title"),
      desc: t("landing.f4Desc"),
      accent: "bg-purple-50 text-purple-700 ring-purple-100",
    },
  ];

  const steps = [
    { n: "01", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { n: "02", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { n: "03", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">KtimaHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/login`}
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t("landing.ctaSignin")}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              {t("landing.ctaSignup")}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-900 to-gray-900 text-white">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-green-500/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-green-700/30 blur-3xl" />
        </div>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 60px)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-36">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t("landing.heroLabel")}
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              {t("landing.tagline")}
            </h1>

            <p className="text-lg sm:text-xl text-green-100/80 max-w-2xl mb-10 leading-relaxed">
              {t("landing.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-green-900 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-xl shadow-black/20 text-base"
              >
                {t("landing.ctaSignup")} →
              </Link>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors text-base border border-white/20"
              >
                {t("landing.ctaSignin")}
              </Link>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap items-center gap-3 mt-12 text-xs text-green-300/70">
              {[
                locale === "el" ? "✓ Δωρεάν εγγραφή" : "✓ Free to sign up",
                locale === "el" ? "✓ Χωρίς πιστωτική κάρτα" : "✓ No credit card",
                locale === "el" ? "✓ Ελληνική & Αγγλική γλώσσα" : "✓ Greek & English",
                locale === "el" ? "✓ Λειτουργεί σε κινητό" : "✓ Mobile friendly",
              ].map((chip) => (
                <span key={chip} className="bg-white/10 rounded-full px-3 py-1 border border-white/10">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Features ── */}
      <section className="py-20 sm:py-28 bg-white">
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
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${f.accent}`}>
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

      {/* ── How it works ── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t("landing.howItWorksTitle")}
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-px bg-green-200" />

            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-600/30">
                  <span className="text-2xl font-bold">{i + 1}</span>
                  <span className="absolute -top-2 -right-2 text-[10px] font-mono text-green-400 bg-green-950 rounded px-1">{s.n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="py-20 bg-green-700 text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-5xl mb-5">🌾</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            {t("landing.ctaBandTitle")}
          </h2>
          <p className="text-green-200 mb-8 text-base sm:text-lg">
            {t("landing.ctaBandSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-green-800 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-xl shadow-black/20 text-base"
            >
              {t("landing.ctaSignup")} →
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors text-base border border-green-500"
            >
              {t("landing.ctaSignin")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌾</span>
              <span className="font-semibold text-gray-200">KtimaHub</span>
              {version && <span className="text-gray-600 text-xs">v{version}</span>}
            </div>
            <div className="flex items-center gap-6 text-xs">
              <Link href={`/${locale}/login`} className="hover:text-gray-200 transition-colors">
                {t("landing.ctaSignin")}
              </Link>
              <Link href={`/${locale}/signup`} className="hover:text-gray-200 transition-colors">
                {t("landing.ctaSignup")}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-xs text-center text-gray-600">
            © {new Date().getFullYear()} KtimaHub · ktimahub.gr
          </div>
        </div>
      </footer>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function SproutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 1 1.4 4.3c1.7-1.1 2.8-2.4 3.1-3.9.3-1.4 0-2.9-.7-4.4-2.5.8-3.8 2.3-3.8 4z"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
