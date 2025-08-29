-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "media" TEXT,
ADD COLUMN     "seen" BOOLEAN NOT NULL DEFAULT false;
