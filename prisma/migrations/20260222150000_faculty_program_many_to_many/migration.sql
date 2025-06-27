-- CreateTable: implicit many-to-many join table for Faculty <-> Program
CREATE TABLE "_FacultyToProgram" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FacultyToProgram_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FacultyToProgram_B_index" ON "_FacultyToProgram"("B");

-- AddForeignKey
ALTER TABLE "_FacultyToProgram" ADD CONSTRAINT "_FacultyToProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultyToProgram" ADD CONSTRAINT "_FacultyToProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- DATA MIGRATION: Map programs to their resolved main faculties
-- ============================================================================

-- Main 6 faculty IDs (looked up from data):
-- Arts:        cmlwxsbx70tdfrogmhgnaae8q
-- Science:     cmlwxx63m0v9trogm197p7v2b
-- Math:        cmlwxt2kj0tnarogmloo7r5cv
-- Engineering: cmlwxw4li0uuurogmhsu14h6a
-- Environment: cmlwy4kdl0yf0rogmvylldfum
-- Health:      cmlwxtkns0tttrogm92uyi21j

-- 1. Programs already in the main 6 faculties → keep same mapping
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT p."facultyId", p.id
FROM "Program" p
WHERE p."facultyId" IN (
  'cmlwxsbx70tdfrogmhgnaae8q',  -- Arts
  'cmlwxx63m0v9trogm197p7v2b',  -- Science
  'cmlwxt2kj0tnarogmloo7r5cv',  -- Math
  'cmlwxw4li0uuurogmhsu14h6a',  -- Engineering
  'cmlwy4kdl0yf0rogmvylldfum',  -- Environment
  'cmlwxtkns0tttrogm92uyi21j'   -- Health
);

-- 2. "Faculty of Arts with X" programs → map to Faculty of Arts
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxsbx70tdfrogmhgnaae8q', p.id
FROM "Program" p
JOIN "Faculty" f ON f.id = p."facultyId"
WHERE f.name LIKE 'Faculty of Arts with%';

-- 3. "Renison University College" programs → map to Faculty of Arts
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxsbx70tdfrogmhgnaae8q', p.id
FROM "Program" p
WHERE p."facultyId" = 'cmlwyk5yh165hrogm2rllbknr';  -- Renison University College

-- 4. Joint faculty programs → map to EACH constituent faculty
-- "Faculties of Engineering and Mathematics" → Engineering + Math
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxw4li0uuurogmhsu14h6a', p.id  -- Engineering
FROM "Program" p
WHERE p."facultyId" = 'cmlwztk501q9arogmzttozio4';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxt2kj0tnarogmloo7r5cv', p.id  -- Math
FROM "Program" p
WHERE p."facultyId" = 'cmlwztk501q9arogmzttozio4';

-- "Faculties of Arts, Health, and Science" → Arts + Health + Science
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxsbx70tdfrogmhgnaae8q', p.id  -- Arts
FROM "Program" p
WHERE p."facultyId" = 'cmlwzb8vs1hr7rogmzttozio4';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxtkns0tttrogm92uyi21j', p.id  -- Health
FROM "Program" p
WHERE p."facultyId" = 'cmlwzb8vs1hr7rogmzttozio4';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxx63m0v9trogm197p7v2b', p.id  -- Science
FROM "Program" p
WHERE p."facultyId" = 'cmlwzb8vs1hr7rogmzttozio4';

-- "Faculties of Health and Science" → Health + Science
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxtkns0tttrogm92uyi21j', p.id  -- Health
FROM "Program" p
WHERE p."facultyId" = 'cmlwz74je1frkrogmst0l1u0u';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxx63m0v9trogm197p7v2b', p.id  -- Science
FROM "Program" p
WHERE p."facultyId" = 'cmlwz74je1frkrogmst0l1u0u';

-- "Faculties of Arts and Mathematics" → Arts + Math
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxsbx70tdfrogmhgnaae8q', p.id  -- Arts
FROM "Program" p
WHERE p."facultyId" = 'cmlwy9xch10zarogmoo05hwjb';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxt2kj0tnarogmloo7r5cv', p.id  -- Math
FROM "Program" p
WHERE p."facultyId" = 'cmlwy9xch10zarogmoo05hwjb';

-- "Faculties of Arts and Environment" → Arts + Environment
INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwxsbx70tdfrogmhgnaae8q', p.id  -- Arts
FROM "Program" p
WHERE p."facultyId" = 'cmlwzwmea1rlzrogmux5e0jby';

INSERT INTO "_FacultyToProgram" ("A", "B")
SELECT 'cmlwy4kdl0yf0rogmvylldfum', p.id  -- Environment
FROM "Program" p
WHERE p."facultyId" = 'cmlwzwmea1rlzrogmux5e0jby';

-- 5. "Unknown" programs → NOT mapped (Co-op Education, Experiential Education)
-- They won't appear in any faculty listing

-- ============================================================================
-- Drop the old single-FK column
-- ============================================================================

-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT IF EXISTS "Program_facultyId_fkey";

-- DropColumn
ALTER TABLE "Program" DROP COLUMN "facultyId";
