-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'subscription_purchase';

-- CreateTable
CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "duration_days" INTEGER NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_purchases" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "package_id" TEXT NOT NULL,
    "purchased_at" BIGINT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_paid" DECIMAL(15,2) NOT NULL,
    "expires_at_after_purchase" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "subscription_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_packages_is_active_idx" ON "service_packages"("is_active");

-- CreateIndex
CREATE INDEX "service_packages_display_order_idx" ON "service_packages"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_expires_at_idx" ON "user_subscriptions"("expires_at");

-- CreateIndex
CREATE INDEX "user_subscriptions_is_active_idx" ON "user_subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "subscription_purchases_subscription_id_idx" ON "subscription_purchases"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_purchases_package_id_idx" ON "subscription_purchases"("package_id");

-- CreateIndex
CREATE INDEX "subscription_purchases_purchased_at_idx" ON "subscription_purchases"("purchased_at");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
