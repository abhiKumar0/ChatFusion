/*
  Warnings:

  - You are about to drop the `_ConversationToMessage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conversationId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_ConversationToMessage" DROP CONSTRAINT "_ConversationToMessage_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConversationToMessage" DROP CONSTRAINT "_ConversationToMessage_B_fkey";

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "conversationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_ConversationToMessage";

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
