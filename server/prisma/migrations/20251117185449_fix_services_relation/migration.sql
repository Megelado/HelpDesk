/*
  Warnings:

  - You are about to drop the `_CalledToService` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CalledToService" DROP CONSTRAINT "_CalledToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_CalledToService" DROP CONSTRAINT "_CalledToService_B_fkey";

-- DropTable
DROP TABLE "_CalledToService";

-- CreateTable
CREATE TABLE "_CalledServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CalledServices_AB_unique" ON "_CalledServices"("A", "B");

-- CreateIndex
CREATE INDEX "_CalledServices_B_index" ON "_CalledServices"("B");

-- AddForeignKey
ALTER TABLE "_CalledServices" ADD CONSTRAINT "_CalledServices_A_fkey" FOREIGN KEY ("A") REFERENCES "calleds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CalledServices" ADD CONSTRAINT "_CalledServices_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
