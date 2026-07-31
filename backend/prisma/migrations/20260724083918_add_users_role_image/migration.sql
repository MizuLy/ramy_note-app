/*
  Warnings:

  - You are about to drop the column `tagId` on the `Notes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoleList" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "Notes" DROP COLUMN "tagId",
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "body" DROP NOT NULL,
ALTER COLUMN "isPinned" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "image" TEXT,
ADD COLUMN     "role" "RoleList" NOT NULL DEFAULT 'USER';
