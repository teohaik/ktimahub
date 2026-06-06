-- Rename single "name" column to "nameEl", add "nameEn" column
ALTER TABLE "Crop" RENAME COLUMN "name" TO "nameEl";
DROP INDEX "Crop_name_key";
CREATE UNIQUE INDEX "Crop_nameEl_key" ON "Crop"("nameEl");

ALTER TABLE "Crop" ADD COLUMN "nameEn" TEXT;
-- Seed nameEn from nameEl so NOT NULL can be enforced after
UPDATE "Crop" SET "nameEn" = "nameEl";
ALTER TABLE "Crop" ALTER COLUMN "nameEn" SET NOT NULL;
CREATE UNIQUE INDEX "Crop_nameEn_key" ON "Crop"("nameEn");
