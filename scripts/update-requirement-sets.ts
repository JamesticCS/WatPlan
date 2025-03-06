import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the Pure Mathematics degree
    const pureMathDegree = await prisma.degree.findFirst({ 
      where: { 
        name: 'Honours Pure Mathematics'
      } 
    });

    if (!pureMathDegree) {
      console.log('Pure Mathematics degree not found');
      return;
    }

    console.log(`Found Pure Mathematics degree with ID: ${pureMathDegree.id}`);

    // Get all requirement sets for this degree
    const requirementSets = await prisma.degreeRequirementSet.findMany({
      where: { 
        degreeId: pureMathDegree.id 
      }
    });

    console.log(`Found ${requirementSets.length} requirement sets`);
    
    // Update each set to have the academic calendar year 2024-2025
    for (const set of requirementSets) {
      await prisma.degreeRequirementSet.update({
        where: { 
          id: set.id 
        },
        data: { 
          academicCalendarYear: '2024-2025' 
        }
      });
      console.log(`Updated requirement set: ${set.name} with academic year 2024-2025`);
    }

    console.log('Successfully updated all requirement sets!');
  } catch (error) {
    console.error('Error updating requirement sets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();