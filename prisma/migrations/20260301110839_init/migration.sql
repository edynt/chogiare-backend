/*
  Warnings:

  - The `message_type` column on the `chat_messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `conversations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `store_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `orders` table. All the data in the column will be lost.
  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `store_id` on the `products` table. All the data in the column will be lost.
  - The `status` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `badges` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `system_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `language` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_no]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seller_slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `buyer_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `condition` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `support_tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_store_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_store_id_fkey";

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_user_id_fkey";

-- DropIndex
DROP INDEX "orders_store_id_idx";

-- DropIndex
DROP INDEX "orders_user_id_idx";

-- DropIndex
DROP INDEX "products_store_id_idx";

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "message_type",
ADD COLUMN     "message_type" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "store_id",
DROP COLUMN "user_id",
ADD COLUMN     "buyer_id" INTEGER NOT NULL,
ADD COLUMN     "order_no" VARCHAR(30),
ADD COLUMN     "payment_image" VARCHAR(500),
ADD COLUMN     "seller_id" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" INTEGER;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "store_id",
DROP COLUMN "condition",
ADD COLUMN     "condition" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "badges",
ADD COLUMN     "badges" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "support_tickets" DROP COLUMN "category",
ADD COLUMN     "category" INTEGER NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "system_settings" DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL,
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "seller_address_info" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_banner" VARCHAR(500),
ADD COLUMN     "seller_business_hours" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_business_info" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_contact_info" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_description" TEXT,
ADD COLUMN     "seller_is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seller_logo" VARCHAR(500),
ADD COLUMN     "seller_metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_name" VARCHAR(255),
ADD COLUMN     "seller_policies" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "seller_product_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seller_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "seller_review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seller_slug" VARCHAR(255),
DROP COLUMN "language",
ADD COLUMN     "language" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "stores";

-- DropEnum
DROP TYPE "ConversationType";

-- DropEnum
DROP TYPE "Language";

-- DropEnum
DROP TYPE "MessageType";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ProductBadge";

-- DropEnum
DROP TYPE "ProductCondition";

-- DropEnum
DROP TYPE "ProductStatus";

-- DropEnum
DROP TYPE "SettingType";

-- DropEnum
DROP TYPE "TicketCategory";

-- DropEnum
DROP TYPE "TicketPriority";

-- DropEnum
DROP TYPE "TicketStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "UserRoleEnum";

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "orders_seller_id_idx" ON "orders"("seller_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_status_payment_status_idx" ON "orders"("status", "payment_status");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_seller_slug_key" ON "users"("seller_slug");

-- CreateIndex
CREATE INDEX "users_seller_slug_idx" ON "users"("seller_slug");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
