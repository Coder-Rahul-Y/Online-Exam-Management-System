/*
  Warnings:

  - You are about to drop the column `timestamp` on the `audit_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "timestamp",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "resource_id" INTEGER,
ADD COLUMN     "resource_type" VARCHAR(100),
ALTER COLUMN "details" DROP NOT NULL;
