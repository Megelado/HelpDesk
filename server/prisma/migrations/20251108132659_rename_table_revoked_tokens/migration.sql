/*
  Warnings:

  - You are about to drop the column `createdAt` on the `revoked_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "revoked_tokens" DROP COLUMN "createdAt",
ADD COLUMN     "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
