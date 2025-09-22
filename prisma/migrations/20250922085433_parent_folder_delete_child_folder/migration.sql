-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_parentFolderId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
