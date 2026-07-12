/*
  Warnings:

  - You are about to drop the column `createdAt` on the `api_key` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `api_key` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `api_key` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_key" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "lastUsedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "last_used_at" TIMESTAMP(3);
