-- CreateTable
CREATE TABLE "price_history" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "old_price" DECIMAL(15,2) NOT NULL,
    "new_price" DECIMAL(15,2) NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_product_id_idx" ON "price_history"("product_id");

-- CreateIndex
CREATE INDEX "price_history_product_id_created_at_idx" ON "price_history"("product_id", "created_at");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
