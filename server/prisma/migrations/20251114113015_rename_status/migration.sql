/*
  Warnings:

  - The values [em_andamento] on the enum `calledStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "calledStatus_new" AS ENUM ('aberto', 'em_atendimento', 'encerrado');
ALTER TABLE "calleds" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "calleds" ALTER COLUMN "status" TYPE "calledStatus_new" USING ("status"::text::"calledStatus_new");
ALTER TYPE "calledStatus" RENAME TO "calledStatus_old";
ALTER TYPE "calledStatus_new" RENAME TO "calledStatus";
DROP TYPE "calledStatus_old";
ALTER TABLE "calleds" ALTER COLUMN "status" SET DEFAULT 'aberto';
COMMIT;
