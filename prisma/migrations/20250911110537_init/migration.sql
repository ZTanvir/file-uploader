-- CreateTable
CREATE TABLE "public"."Folder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentFolderId" INTEGER,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_parentFolderId_key" ON "public"."Folder"("parentFolderId");

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "public"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
