/*
  Warnings:

  - You are about to drop the column `antirequisites` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `requirementRootId` on the `Degree` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Degree" DROP CONSTRAINT "Degree_programId_fkey";

-- DropForeignKey
ALTER TABLE "Degree" DROP CONSTRAINT "Degree_requirementRootId_fkey";

-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_facultyId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "antirequisites",
ADD COLUMN     "antiRequisiteText" TEXT,
ADD COLUMN     "crossListedWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialConsentToAdd" TEXT,
ADD COLUMN     "specialConsentToDrop" TEXT,
ADD COLUMN     "specialCourseGrading" TEXT;

-- AlterTable
ALTER TABLE "Degree" DROP COLUMN "requirementRootId",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "studentAudience" TEXT,
ALTER COLUMN "systemsOfStudy" DROP NOT NULL,
ALTER COLUMN "systemsOfStudy" DROP DEFAULT,
ALTER COLUMN "systemsOfStudy" SET DATA TYPE TEXT,
ALTER COLUMN "minimumAverages" DROP NOT NULL,
ALTER COLUMN "minimumAverages" DROP DEFAULT,
ALTER COLUMN "minimumAverages" SET DATA TYPE TEXT,
ALTER COLUMN "graduationRequirements" DROP NOT NULL,
ALTER COLUMN "graduationRequirements" DROP DEFAULT,
ALTER COLUMN "graduationRequirements" SET DATA TYPE TEXT,
ALTER COLUMN "additionalConstraints" DROP NOT NULL,
ALTER COLUMN "additionalConstraints" DROP DEFAULT,
ALTER COLUMN "additionalConstraints" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "RequirementSection" (
    "id" TEXT NOT NULL,
    "degreeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "requirementRootId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementSection_requirementRootId_key" ON "RequirementSection"("requirementRootId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RequirementSection" ADD CONSTRAINT "RequirementSection_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementSection" ADD CONSTRAINT "RequirementSection_requirementRootId_fkey" FOREIGN KEY ("requirementRootId") REFERENCES "Requirement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
