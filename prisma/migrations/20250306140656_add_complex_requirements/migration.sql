-- AlterTable
ALTER TABLE "DegreeRequirement" ADD COLUMN     "concentrationType" TEXT,
ADD COLUMN     "maxSubjects" INTEGER,
ADD COLUMN     "minCoursesPerSubject" INTEGER,
ADD COLUMN     "minSubjects" INTEGER;

-- CreateTable
CREATE TABLE "RequirementList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requirementId" TEXT NOT NULL,

    CONSTRAINT "RequirementList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementListCourse" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "RequirementListCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSubstitution" (
    "id" TEXT NOT NULL,
    "originalCourseId" TEXT NOT NULL,
    "substituteCourseId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "planTypeRestriction" TEXT,

    CONSTRAINT "CourseSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementListCourse_listId_courseId_key" ON "RequirementListCourse"("listId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSubstitution_originalCourseId_substituteCourseId_requ_key" ON "CourseSubstitution"("originalCourseId", "substituteCourseId", "requirementId");

-- AddForeignKey
ALTER TABLE "RequirementList" ADD CONSTRAINT "RequirementList_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DegreeRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementListCourse" ADD CONSTRAINT "RequirementListCourse_listId_fkey" FOREIGN KEY ("listId") REFERENCES "RequirementList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementListCourse" ADD CONSTRAINT "RequirementListCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubstitution" ADD CONSTRAINT "CourseSubstitution_originalCourseId_fkey" FOREIGN KEY ("originalCourseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubstitution" ADD CONSTRAINT "CourseSubstitution_substituteCourseId_fkey" FOREIGN KEY ("substituteCourseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubstitution" ADD CONSTRAINT "CourseSubstitution_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DegreeRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
