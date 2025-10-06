/*
  Warnings:

  - You are about to drop the column `keyNonce` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `salt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "keyNonce",
DROP COLUMN "salt";
