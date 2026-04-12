import { getTranslations } from "next-intl/server";

export default async function MyFieldsPage() {
  const t = await getTranslations("crops");
  return <h1 className="text-2xl font-bold">{t("title")}</h1>;
}
