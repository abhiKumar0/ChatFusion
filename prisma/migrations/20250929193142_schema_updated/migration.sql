/*
  Warnings:

  - The primary key for the `ConversationParticipant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ConversationParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `ConversationParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `parentMessageId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `seen` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('ONE_TO_ONE', 'GROUP');

-- CreateEnum
CREATE TYPE "public"."ParticipantRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_parentMessageId_fkey";

-- DropIndex
DROP INDEX "public"."ConversationParticipant_conversationId_userId_key";

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" "public"."ConversationType" NOT NULL DEFAULT 'ONE_TO_ONE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_pkey",
DROP COLUMN "id",
DROP COLUMN "joinedAt",
ADD COLUMN     "role" "public"."ParticipantRole" NOT NULL DEFAULT 'MEMBER',
ADD CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("userId", "conversationId");

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "parentMessageId",
DROP COLUMN "seen";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "bio",
DROP COLUMN "fullName",
DROP COLUMN "status",
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "public"."FriendRequest" (
    "id" TEXT NOT NULL,
    "status" "public"."FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "public"."FriendRequest"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
