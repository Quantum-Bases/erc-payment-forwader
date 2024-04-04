/*
  Warnings:

  - Added the required column `status` to the `Trnasections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trnasections" ADD COLUMN     "status" TEXT NOT NULL;
