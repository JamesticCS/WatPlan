-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "catalogNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "units" DOUBLE PRECISION NOT NULL,
    "prerequisites" TEXT,
    "corequisites" TEXT,
    "antirequisites" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "facultyId" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Degree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "programId" TEXT NOT NULL,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirementSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "degreeId" TEXT NOT NULL,

    CONSTRAINT "DegreeRequirementSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requirementSetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unitsRequired" DOUBLE PRECISION,
    "coursesRequired" INTEGER,
    "levelRestriction" TEXT,
    "courseCodeRestriction" TEXT,

    CONSTRAINT "DegreeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirementCourse" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DegreeRequirementCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCourse" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "term" TEXT,
    "status" TEXT NOT NULL,
    "grade" TEXT,

    CONSTRAINT "PlanCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDegree" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "degreeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "PlanDegree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanRequirement" (
    "id" TEXT NOT NULL,
    "planDegreeId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" DOUBLE PRECISION,

    CONSTRAINT "PlanRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Course_courseCode_catalogNumber_key" ON "Course"("courseCode", "catalogNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Program_name_facultyId_key" ON "Program"("name", "facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Degree_name_programId_key" ON "Degree"("name", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "DegreeRequirementSet_name_degreeId_key" ON "DegreeRequirementSet"("name", "degreeId");

-- CreateIndex
CREATE UNIQUE INDEX "DegreeRequirementCourse_requirementId_courseId_key" ON "DegreeRequirementCourse"("requirementId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCourse_planId_courseId_key" ON "PlanCourse"("planId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDegree_planId_degreeId_type_key" ON "PlanDegree"("planId", "degreeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PlanRequirement_planDegreeId_requirementId_key" ON "PlanRequirement"("planDegreeId", "requirementId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirementSet" ADD CONSTRAINT "DegreeRequirementSet_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "Degree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirement" ADD CONSTRAINT "DegreeRequirement_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "DegreeRequirementSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirementCourse" ADD CONSTRAINT "DegreeRequirementCourse_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DegreeRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirementCourse" ADD CONSTRAINT "DegreeRequirementCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCourse" ADD CONSTRAINT "PlanCourse_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCourse" ADD CONSTRAINT "PlanCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDegree" ADD CONSTRAINT "PlanDegree_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDegree" ADD CONSTRAINT "PlanDegree_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "Degree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRequirement" ADD CONSTRAINT "PlanRequirement_planDegreeId_fkey" FOREIGN KEY ("planDegreeId") REFERENCES "PlanDegree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRequirement" ADD CONSTRAINT "PlanRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DegreeRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
