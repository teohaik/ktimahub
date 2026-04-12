-- Migrate from single role column to roles array column

-- Step 1: add the new column (default LEASEHOLDER so existing rows are valid)
ALTER TABLE "User" ADD COLUMN "roles" "Role"[] NOT NULL DEFAULT ARRAY['LEASEHOLDER']::"Role"[];

-- Step 2: copy existing single role value into the new array
UPDATE "User" SET "roles" = ARRAY["role"];

-- Step 3: remove the old column
ALTER TABLE "User" DROP COLUMN "role";
