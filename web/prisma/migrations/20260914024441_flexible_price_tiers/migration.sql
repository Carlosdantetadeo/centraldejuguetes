/*
  Warnings:

  - You are about to drop the column `priceMetro` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `priceRollo` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unitRollo` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "priceMetro",
DROP COLUMN "priceRollo",
DROP COLUMN "unitRollo",
ADD COLUMN     "priceTiers" JSONB;
