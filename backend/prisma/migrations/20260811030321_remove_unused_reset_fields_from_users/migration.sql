/*
  Warnings:

  - You are about to drop the column `resetToken` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `ResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry";

-- DropTable
DROP TABLE "ResetToken";

-- CreateTable
CREATE TABLE "ResetTokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResetTokens_token_key" ON "ResetTokens"("token");
