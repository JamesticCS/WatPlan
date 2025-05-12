import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseCount = await prisma.course.count();
  console.log(`Total courses in the database: ${courseCount}`);
  
  // Get count by subject area
  const coursesBySubject = await prisma.$queryRaw`
    SELECT "courseCode", COUNT(*) as count 
    FROM "Course" 
    GROUP BY "courseCode" 
    ORDER BY count DESC 
    LIMIT 20
  `;
  
  console.log('\nTop 20 subjects by course count:');
  console.log(coursesBySubject);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });