/*
  Warnings:

  - A unique constraint covering the columns `[tag,userId]` on the table `Tags` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tags_tag_key";

-- AlterTable
ALTER TABLE "Tags" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tags_tag_userId_key" ON "Tags"("tag", "userId");

-- AddForeignKey
ALTER TABLE "Tags" ADD CONSTRAINT "Tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
