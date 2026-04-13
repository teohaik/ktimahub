-- Fix 1: Remove LEASEHOLDER as default role for new users
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT '{}';

-- Fix 2: Add ownerId to Field
-- Step 1: add nullable column
ALTER TABLE "Field" ADD COLUMN "ownerId" TEXT;

-- Step 2: assign all existing fields to the first LAND_OWNER in the DB
UPDATE "Field"
SET "ownerId" = (
  SELECT id FROM "User"
  WHERE 'LAND_OWNER' = ANY(roles::text[])
  ORDER BY "createdAt" ASC
  LIMIT 1
);

-- Step 3: enforce NOT NULL now that existing rows are backfilled
ALTER TABLE "Field" ALTER COLUMN "ownerId" SET NOT NULL;

-- Step 4: add foreign key constraint
ALTER TABLE "Field" ADD CONSTRAINT "Field_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
