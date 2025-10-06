-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "encryptedPrivateKey" TEXT,
ADD COLUMN     "keyNonce" TEXT,
ADD COLUMN     "salt" TEXT;
