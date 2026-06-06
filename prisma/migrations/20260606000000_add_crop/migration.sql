CREATE TABLE "Crop" (
  "id"        TEXT NOT NULL,
  "nameEl"    TEXT NOT NULL,
  "nameEn"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Crop_nameEl_key" ON "Crop"("nameEl");
CREATE UNIQUE INDEX "Crop_nameEn_key" ON "Crop"("nameEn");

ALTER TABLE "Field" ADD COLUMN "cropId" TEXT;
ALTER TABLE "Field" ADD CONSTRAINT "Field_cropId_fkey"
  FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
