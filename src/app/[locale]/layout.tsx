import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "next-auth/react";
import "../globals.css";

const APP_URL = "https://ktimahub.gr";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KtimaHub — Διαχείριση Αγροτεμαχίων",
    template: "%s · KtimaHub",
  },
  description:
    "Αποθηκεύστε τα αγροτεμάχιά σας στον χάρτη, παρακολουθείτε ενοικιαστές και ιστορικό καλλιεργειών. Smart agricultural land management for Greek landowners.",
  keywords: [
    "αγροτεμάχια",
    "διαχείριση γης",
    "κτηματολόγιο",
    "ενοικιαστές",
    "καλλιέργειες",
    "agricultural land management",
    "Greece",
    "KtimaHub",
  ],
  authors: [{ name: "KtimaHub" }],
  creator: "KtimaHub",
  publisher: "KtimaHub",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "KtimaHub",
    title: "KtimaHub — Διαχείριση Αγροτεμαχίων",
    description:
      "Αποθηκεύστε τα αγροτεμάχιά σας στον χάρτη, παρακολουθείτε ενοικιαστές και ιστορικό καλλιεργειών.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "KtimaHub — Διαχείριση Αγροτεμαχίων",
      },
    ],
    locale: "el_GR",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ktimahub",
    title: "KtimaHub — Διαχείριση Αγροτεμαχίων",
    description:
      "Αποθηκεύστε τα αγροτεμάχιά σας στον χάρτη, παρακολουθείτε ενοικιαστές και καλλιέργειες.",
    images: ["/api/og"],
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      el: `${APP_URL}/el`,
      en: `${APP_URL}/en`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "el" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
