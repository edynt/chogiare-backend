-- Remove isSeller column from users table
-- All users can now become sellers, so this flag is no longer needed

-- Drop the index first
DROP INDEX IF EXISTS "users_is_seller_idx";

-- Drop the column
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_seller";
