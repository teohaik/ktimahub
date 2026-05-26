-- CreateEnum
CREATE TYPE "CultivationType" AS ENUM ('ANNUAL', 'PERENNIAL', 'OLIVE', 'OTHER_TREES', 'PASTURE', 'FOREST', 'OTHER');

-- AlterTable
ALTER TABLE "Field" ADD COLUMN "cultivationType" "CultivationType";
