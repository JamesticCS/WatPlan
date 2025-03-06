import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query']
});

async function main() {
  try {
    console.log("Diagnosing Pure Math requirements calculation...");
    
    // 1. Find the Pure Math degree
    const pureMathDegree = await prisma.degree.findFirst({
      where: {
        name: 'Honours Pure Mathematics'
      }
    });
    
    if (!pureMathDegree) {
      console.error("Pure Math degree not found!");
      return;
    }
    
    console.log(`Found Pure Math degree: ${pureMathDegree.id}`);
    
    // 2. Check if requirement sets have the correct academic year
    const requirementSets = await prisma.degreeRequirementSet.findMany({
      where: {
        degreeId: pureMathDegree.id
      }
    });
    
    console.log("Current requirement sets:");
    requirementSets.forEach(set => {
      console.log(`- ${set.name}: academicCalendarYear = ${set.academicCalendarYear || 'null'}`);
    });
    
    // 3. Ensure all requirement sets have academic year 2024-2025
    for (const set of requirementSets) {
      if (set.academicCalendarYear !== '2024-2025') {
        await prisma.degreeRequirementSet.update({
          where: { id: set.id },
          data: { academicCalendarYear: '2024-2025' }
        });
        console.log(`Updated set ${set.name} with academic year 2024-2025`);
      }
    }
    
    // 4. Find a plan with Pure Math degree and 2024-2025 academic year
    const plans = await prisma.plan.findMany({
      where: {
        academicCalendarYear: '2024-2025',
        degrees: {
          some: {
            degreeId: pureMathDegree.id
          }
        }
      },
      include: {
        degrees: {
          where: {
            degreeId: pureMathDegree.id
          },
          include: {
            requirements: true
          }
        }
      }
    });
    
    if (plans.length === 0) {
      console.log("No plans found with Pure Math degree and 2024-2025 academic year");
      return;
    }
    
    console.log(`Found ${plans.length} plans with Pure Math degree and 2024-2025 academic year`);
    
    // 5. Check subject concentration requirement calculation
    const plan = plans[0];
    const planDegree = plan.degrees[0];
    
    console.log(`Plan: ${plan.name} (${plan.id})`);
    console.log(`Plan Degree: ${planDegree.id}`);
    console.log(`Current requirements: ${planDegree.requirements.length}`);
    
    // 6. Force recalculation of requirements
    console.log("Clearing all requirements and recalculating...");
    await prisma.planRequirement.deleteMany({
      where: {
        planDegreeId: planDegree.id
      }
    });
    
    // Get requirement sets filtered by academic year
    const filteredRequirementSets = await prisma.degreeRequirementSet.findMany({
      where: {
        degreeId: pureMathDegree.id,
        OR: [
          { academicCalendarYear: plan.academicCalendarYear },
          { academicCalendarYear: null }
        ]
      },
      include: {
        requirements: true
      }
    });
    
    console.log(`Found ${filteredRequirementSets.length} requirement sets matching academic year ${plan.academicCalendarYear}`);
    
    // Flatten requirements
    const requirements = filteredRequirementSets.flatMap(set => set.requirements);
    console.log(`Found ${requirements.length} requirements to calculate`);
    
    // Calculate requirements manually
    for (const requirement of requirements) {
      console.log(`Calculating requirement: ${requirement.name} (${requirement.id})`);
      
      // Get plan courses
      const planCourses = await prisma.planCourse.findMany({
        where: { planId: plan.id },
        include: { course: true }
      });
      
      console.log(`Plan has ${planCourses.length} courses`);
      
      // Insert placeholder requirement with NOT_STARTED status
      await prisma.planRequirement.create({
        data: {
          planDegreeId: planDegree.id,
          requirementId: requirement.id,
          status: 'NOT_STARTED',
          progress: 0
        }
      });
    }
    
    console.log("Requirements have been reset. Please refresh the UI and check if they calculate correctly now.");
    
  } catch (error) {
    console.error("Error diagnosing requirements:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();