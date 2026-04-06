-- AlterTable
ALTER TABLE "User"
ADD COLUMN "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN "refreshToken" TEXT;
