import { getTranslations } from "next-intl/server";

export default async function FieldsPage() {
  const t = await getTranslations("fields");
  return <h1 className="text-2xl font-bold">{t("title")}</h1>;
}
