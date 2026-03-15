-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'boost';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "boost_end_at" BIGINT;

-- CreateTable
CREATE TABLE "product_boosts" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "price_paid" DECIMAL(15,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "start_at" BIGINT NOT NULL,
    "end_at" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "product_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_boosts_product_id_idx" ON "product_boosts"("product_id");

-- CreateIndex
CREATE INDEX "product_boosts_package_id_idx" ON "product_boosts"("package_id");

-- CreateIndex
CREATE INDEX "product_boosts_is_active_idx" ON "product_boosts"("is_active");

-- CreateIndex
CREATE INDEX "product_boosts_end_at_idx" ON "product_boosts"("end_at");

-- CreateIndex
CREATE INDEX "products_boost_end_at_idx" ON "products"("boost_end_at");

-- AddForeignKey
ALTER TABLE "product_boosts" ADD CONSTRAINT "product_boosts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_boosts" ADD CONSTRAINT "product_boosts_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
