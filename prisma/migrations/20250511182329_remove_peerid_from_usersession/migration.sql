/*
  Warnings:

  - You are about to drop the column `peerId` on the `UserSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropIndex
DROP INDEX "UserSession_peerId_idx";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '3 hours';

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "peerId";

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_isOnline_idx" ON "UserSession"("isOnline");
