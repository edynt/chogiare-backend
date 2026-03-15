/*
  Warnings:

  - The primary key for the `service_packages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `service_packages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `package_id` on the `subscription_purchases` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "subscription_purchases" DROP CONSTRAINT "subscription_purchases_package_id_fkey";

-- AlterTable
ALTER TABLE "service_packages" DROP CONSTRAINT "service_packages_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "subscription_purchases" DROP COLUMN "package_id",
ADD COLUMN     "package_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "subscription_purchases_package_id_idx" ON "subscription_purchases"("package_id");

-- AddForeignKey
ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
