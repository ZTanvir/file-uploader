-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_parentFolderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropIndex
DROP INDEX "public"."File_name_key";

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
