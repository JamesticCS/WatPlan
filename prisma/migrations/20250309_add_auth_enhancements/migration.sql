-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT,
                  ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false,
                  ADD COLUMN "guestExpiresAt" TIMESTAMP(3);