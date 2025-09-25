/*
  Warnings:

  - You are about to drop the column `folderId` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_folderId_fkey";

-- AlterTable
ALTER TABLE "public"."File" DROP COLUMN "folderId",
ADD COLUMN     "parentFolderId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "public"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
