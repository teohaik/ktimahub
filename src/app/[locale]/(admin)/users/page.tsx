import { getTranslations } from "next-intl/server";

export default async function UsersPage() {
  const t = await getTranslations("users");
  return <h1 className="text-2xl font-bold">{t("title")}</h1>;
}
