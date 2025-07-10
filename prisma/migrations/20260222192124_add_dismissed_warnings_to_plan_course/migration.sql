-- AlterTable
ALTER TABLE "PlanCourse" ADD COLUMN     "dismissedWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[];
