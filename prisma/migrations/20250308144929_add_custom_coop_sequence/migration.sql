-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "coopSequence" TEXT DEFAULT 'NO_COOP',
ADD COLUMN     "customTerms" TEXT[] DEFAULT ARRAY[]::TEXT[];
