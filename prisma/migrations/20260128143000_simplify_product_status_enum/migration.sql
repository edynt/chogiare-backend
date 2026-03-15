-- First, update existing products with old statuses to 'active'
UPDATE "products" SET "status" = 'active' WHERE "status" IN ('sold', 'archived', 'suspended');

-- Create new enum type
CREATE TYPE "ProductStatus_new" AS ENUM ('draft', 'active', 'out_of_stock');

-- Drop the default first
ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT;

-- Change column to use new enum
ALTER TABLE "products" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");

-- Set new default
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft'::"ProductStatus_new";

-- Drop old enum and rename new
DROP TYPE "ProductStatus";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
