-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "uwflowEasy" DOUBLE PRECISION,
ADD COLUMN     "uwflowLiked" DOUBLE PRECISION,
ADD COLUMN     "uwflowRatingsCount" INTEGER,
ADD COLUMN     "uwflowUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "uwflowUseful" DOUBLE PRECISION;
