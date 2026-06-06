import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import FieldForm from "@/components/fields/FieldForm";
import Link from "next/link";
import type { LatLng } from "@/lib/map/types";

export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations();

  const [field, leaseholders, allFields, crops] = await Promise.all([
    db.field.findUnique({ where: { id, ownerId: session.user.id } }),
    db.user.findMany({
      where: { roles: { has: "LEASEHOLDER" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.field.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
      orderBy: { name: "asc" },
    }),
    db.crop.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!field) notFound();

  const fieldIndex = allFields.findIndex((f) => f.id === id);
  const prevId = fieldIndex > 0 ? allFields[fieldIndex - 1].id : null;
  const nextId = fieldIndex < allFields.length - 1 ? allFields[fieldIndex + 1].id : null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/${locale}/fields`} className="hover:text-gray-800">
          {t("fields.title")}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{field.name}</span>
      </div>
      <FieldForm
        leaseholders={leaseholders}
        crops={crops}
        prevId={prevId}
        nextId={nextId}
        fieldIndex={fieldIndex}
        totalFields={allFields.length}
        initial={{
          id: field.id,
          name: field.name,
          fieldNumber: field.fieldNumber ?? null,
          kaek: field.kaek,
          officialArea: field.officialArea,
          calculatedArea: field.calculatedArea,
          polygon: (field.polygon as LatLng[] | null) ?? null,
          leaseholderId: field.leaseholderId,
          cropId: field.cropId,
        }}
      />
    </div>
  );
}
