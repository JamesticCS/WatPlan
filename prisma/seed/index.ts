import { PrismaClient } from '@prisma/client';
import { seedFaculties } from './faculties';
import { seedPrograms } from './programs';
import { seedDegrees } from './degrees';
import { seedCourses } from './courses';
import { seedRequirements } from './requirements';
// Import program-specific seed functions
import { seedPureMathProgram } from './programs/pure-math';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  
  // Clear existing data
  await prisma.$transaction([
    prisma.planRequirement.deleteMany(),
    prisma.planCourse.deleteMany(),
    prisma.planDegree.deleteMany(),
    prisma.plan.deleteMany(),
    prisma.requirementListCourse.deleteMany(),
    prisma.requirementList.deleteMany(),
    prisma.courseSubstitution.deleteMany(),
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
  
  // Completely delete ALL existing Pure Math data to start fresh
  try {
    // Find the Pure Math program
    const pureMathProgram = await prisma.program.findFirst({
      where: { name: 'Pure Mathematics' }
    });
    
    if (pureMathProgram) {
      // Get all Pure Math degrees
      const degrees = await prisma.degree.findMany({
        where: { programId: pureMathProgram.id },
        include: { 
          requirementSets: {
            include: {
              requirements: true
            }
          },
          planDegrees: true
        }
      });
      
      console.log(`Found ${degrees.length} existing Pure Math degrees, removing all of them`);
      
      // Delete all Pure Math degrees
      for (const degree of degrees) {
        // First handle any plan associations
        if (degree.planDegrees.length > 0) {
          for (const planDegree of degree.planDegrees) {
            // Delete any plan requirements related to this plan degree
            await prisma.planRequirement.deleteMany({
              where: { planDegreeId: planDegree.id }
            });
          }
          
          // Delete plan degrees
          await prisma.planDegree.deleteMany({
            where: { degreeId: degree.id }
          });
        }
        
        // Handle requirement sets
        for (const reqSet of degree.requirementSets) {
          // Delete requirement courses for all requirements in this set
          for (const req of reqSet.requirements) {
            await prisma.degreeRequirementCourse.deleteMany({
              where: { requirementId: req.id }
            });
            
            // Delete any course substitutions
            await prisma.courseSubstitution.deleteMany({
              where: { requirementId: req.id }
            });
            
            // Delete any requirement lists
            const lists = await prisma.requirementList.findMany({
              where: { requirementId: req.id }
            });
            
            for (const list of lists) {
              // Delete list courses
              await prisma.requirementListCourse.deleteMany({
                where: { listId: list.id }
              });
              
              // Delete the list
              await prisma.requirementList.delete({
                where: { id: list.id }
              });
            }
          }
          
          // Delete requirements
          await prisma.degreeRequirement.deleteMany({
            where: { requirementSetId: reqSet.id }
          });
          
          // Delete the requirement set
          await prisma.degreeRequirementSet.delete({
            where: { id: reqSet.id }
          });
        }
        
        // Delete the degree
        await prisma.degree.delete({
          where: { id: degree.id }
        });
      }
      
      console.log('Completely removed all Pure Math degree data');
    }
  } catch (error) {
    console.error('Error removing existing Pure Math data:', error);
  }

  // Seed program-specific requirements
  try {
    await seedPureMathProgram(prisma);
  } catch (error) {
    console.error('Error seeding Pure Math program:', error);
    // Continue with other programs even if one fails
  }
  
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