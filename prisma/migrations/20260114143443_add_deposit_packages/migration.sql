-- CreateTable
CREATE TABLE "deposit_packages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "deposit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deposit_packages_is_active_idx" ON "deposit_packages"("is_active");

-- CreateIndex
CREATE INDEX "deposit_packages_display_order_idx" ON "deposit_packages"("display_order");
