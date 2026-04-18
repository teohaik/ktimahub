import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations("auth");

  type Status = "pending" | "success" | "expired" | "invalid";
  let status: Status = "pending";

  if (token) {
    const record = await db.verificationToken.findUnique({ where: { token } });

    if (!record) {
      status = "invalid";
    } else if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      status = "expired";
    } else {
      await db.user.update({
        where: { email: record.identifier },
        data: { status: "ACTIVE", emailVerified: new Date() },
      });
      await db.verificationToken.delete({ where: { token } });
      status = "success";
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-gray-100">
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm font-medium">KtimaHub</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          {status === "pending" && (
            <>
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {t("verifyEmailTitle")}
              </h1>
              <p className="text-sm text-gray-500">{t("verifyEmailDesc")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {t("verifyEmailSuccess")}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {t("verifyEmailSuccessDesc")}
              </p>
              <Link
                href={`/${locale}/login?verified=1`}
                className="inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                {t("signIn")}
              </Link>
            </>
          )}

          {(status === "expired" || status === "invalid") && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {t("verifyEmailError")}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {status === "expired" ? t("verifyEmailExpired") : t("verifyEmailInvalid")}
              </p>
              <Link
                href={`/${locale}/signup`}
                className="inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                {t("signUp")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
