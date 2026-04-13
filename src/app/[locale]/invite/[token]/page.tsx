import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import InviteAcceptForm from "@/components/auth/InviteAcceptForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

type Props = { params: Promise<{ locale: string; token: string }> };

export default async function InvitePage({ params }: Props) {
  const { locale, token } = await params;
  const t = await getTranslations("invite");

  const invite = await db.invite.findUnique({ where: { token } });

  const isInvalid =
    !invite || !!invite.usedAt || invite.expiresAt < new Date();
  const isUsed = invite?.usedAt != null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-gray-100">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌾</div>
            <h1 className="text-2xl font-bold text-gray-900">Field Manager</h1>
          </div>

          {isInvalid ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-3">
              <div className="text-3xl">⚠️</div>
              <p className="font-semibold text-gray-900">
                {isUsed ? t("alreadyUsed") : t("invalidToken")}
              </p>
              <p className="text-sm text-gray-500">{t("contactAdmin")}</p>
            </div>
          ) : (
            <InviteAcceptForm
              token={token}
              email={invite!.email}
              roles={invite!.roles as string[]}
              locale={locale}
            />
          )}
        </div>
      </div>
    </div>
  );
}
