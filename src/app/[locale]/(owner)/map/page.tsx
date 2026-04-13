import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import MapView from "@/components/map/MapView";

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations("map");

  const fields = await db.field.findMany({
    select: {
      id: true,
      name: true,
      fieldNumber: true,
      polygon: true,
    },
  });

  const fieldPolygons = fields
    .filter((f) => f.polygon !== null)
    .map((f) => ({
      id: f.id,
      name: f.name,
      fieldNumber: f.fieldNumber ?? null,
      vertices: f.polygon as { lat: number; lng: number }[],
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <MapView polygons={fieldPolygons} />
    </div>
  );
}
