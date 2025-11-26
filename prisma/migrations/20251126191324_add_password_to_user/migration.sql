-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '3 hours';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;
