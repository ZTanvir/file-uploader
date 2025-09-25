-- AlterTable
CREATE SEQUENCE "public".file_id_seq;
ALTER TABLE "public"."File" ALTER COLUMN "id" SET DEFAULT nextval('"public".file_id_seq'),
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
ALTER SEQUENCE "public".file_id_seq OWNED BY "public"."File"."id";

-- DropIndex
DROP INDEX "public"."File_id_key";
