-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costKes" INTEGER;

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
