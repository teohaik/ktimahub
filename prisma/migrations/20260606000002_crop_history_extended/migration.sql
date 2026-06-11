-- Make cropType nullable (backward compat — old rows keep their enum value)
ALTER TABLE "CropHistory" ALTER COLUMN "cropType" DROP NOT NULL;

-- Add dynamic crop FK
ALTER TABLE "CropHistory" ADD COLUMN "cropId" TEXT;
ALTER TABLE "CropHistory" ADD CONSTRAINT "CropHistory_cropId_fkey"
  FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add per-year leaseholder FK
ALTER TABLE "CropHistory" ADD COLUMN "leaseholderId" TEXT;
ALTER TABLE "CropHistory" ADD CONSTRAINT "CropHistory_leaseholderId_fkey"
  FOREIGN KEY ("leaseholderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
