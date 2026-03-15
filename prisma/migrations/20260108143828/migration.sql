/*
  Warnings:

  - The values [boost] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `boost_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `boost_packages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_boosts` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('deposit', 'sale', 'refund', 'commission', 'bonus', 'subscription_purchase');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "product_boosts" DROP CONSTRAINT "product_boosts_boost_package_id_fkey";

-- DropForeignKey
ALTER TABLE "product_boosts" DROP CONSTRAINT "product_boosts_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_boosts" DROP CONSTRAINT "product_boosts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_boost_id_fkey";

-- DropIndex
DROP INDEX "transactions_boost_id_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "boost_id";

-- DropTable
DROP TABLE "boost_packages";

-- DropTable
DROP TABLE "product_boosts";

-- DropEnum
DROP TYPE "BoostStatus";
