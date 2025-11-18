/*
  Warnings:

  - You are about to drop the column `service_id` on the `calleds` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "calleds" DROP CONSTRAINT "calleds_service_id_fkey";

-- AlterTable
ALTER TABLE "calleds" DROP COLUMN "service_id";

-- CreateTable
CREATE TABLE "_CalledToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CalledToService_AB_unique" ON "_CalledToService"("A", "B");

-- CreateIndex
CREATE INDEX "_CalledToService_B_index" ON "_CalledToService"("B");

-- AddForeignKey
ALTER TABLE "_CalledToService" ADD CONSTRAINT "_CalledToService_A_fkey" FOREIGN KEY ("A") REFERENCES "calleds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CalledToService" ADD CONSTRAINT "_CalledToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
