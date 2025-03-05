import { PrismaClient } from '@prisma/client';
import { seedFaculties } from './faculties';
import { seedPrograms } from './programs';
import { seedDegrees } from './degrees';
import { seedCourses } from './courses';
import { seedRequirements } from './requirements';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  
  // Clear existing data
  await prisma.$transaction([
    prisma.planRequirement.deleteMany(),
    prisma.planCourse.deleteMany(),
    prisma.planDegree.deleteMany(),
    prisma.plan.deleteMany(),
    prisma.degreeRequirementCourse.deleteMany(),
    prisma.degreeRequirement.deleteMany(),
    prisma.degreeRequirementSet.deleteMany(),
    prisma.degree.deleteMany(),
    prisma.program.deleteMany(),
    prisma.faculty.deleteMany(),
    prisma.course.deleteMany(),
  ]);
  
  // Seed data
  await seedFaculties(prisma);
  await seedPrograms(prisma);
  await seedDegrees(prisma);
  await seedCourses(prisma);
  await seedRequirements(prisma);
  
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });