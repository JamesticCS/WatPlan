-- AlterTable
ALTER TABLE "DegreeRequirement" ADD COLUMN     "customLogicParams" TEXT,
ADD COLUMN     "customLogicType" TEXT,
ADD COLUMN     "failureRestriction" TEXT,
ADD COLUMN     "maxFailures" INTEGER,
ADD COLUMN     "maxUnits" DOUBLE PRECISION,
ADD COLUMN     "minAverage" DOUBLE PRECISION,
ADD COLUMN     "minGradeRequired" INTEGER,
ADD COLUMN     "requireConcurrent" TEXT;

-- AlterTable
ALTER TABLE "PlanCourse" ADD COLUMN     "numericGrade" DOUBLE PRECISION;
