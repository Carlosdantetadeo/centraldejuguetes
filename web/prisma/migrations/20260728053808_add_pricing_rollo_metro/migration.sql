-- DropIndex
DROP INDEX "idx_product_name_trgm";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceMetro" DOUBLE PRECISION,
ADD COLUMN     "priceRollo" DOUBLE PRECISION,
ADD COLUMN     "unitRollo" TEXT,
ALTER COLUMN "price" SET DEFAULT 0;
