-- Drop and recreate service_packages and subscription_purchases tables
-- This is a BREAKING CHANGE that requires fresh data

-- Drop dependent tables first
DROP TABLE IF EXISTS "subscription_purchases" CASCADE;
DROP TABLE IF EXISTS "service_packages" CASCADE;

-- Recreate service_packages with INTEGER id
CREATE TABLE "service_packages" (
    "id" SERIAL NOT NULL,
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

-- Recreate subscription_purchases with INTEGER packageId
CREATE TABLE "subscription_purchases" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "purchased_at" BIGINT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_paid" DECIMAL(15,2) NOT NULL,
    "expires_at_after_purchase" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "subscription_purchases_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "service_packages_is_active_idx" ON "service_packages"("is_active");
CREATE INDEX "service_packages_display_order_idx" ON "service_packages"("display_order");

CREATE INDEX "subscription_purchases_subscription_id_idx" ON "subscription_purchases"("subscription_id");
CREATE INDEX "subscription_purchases_package_id_idx" ON "subscription_purchases"("package_id");
CREATE INDEX "subscription_purchases_purchased_at_idx" ON "subscription_purchases"("purchased_at");

-- Add foreign keys
ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_package_id_fkey"
    FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
