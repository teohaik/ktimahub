import { getTranslations } from "next-intl/server";

export default async function MapPage() {
  const t = await getTranslations("map");
  return <h1 className="text-2xl font-bold">{t("title")}</h1>;
}
