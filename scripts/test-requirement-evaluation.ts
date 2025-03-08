import { PrismaClient } from '@prisma/client';
import { calculateRequirementProgress, updateAllRequirementsForPlan } from '../src/lib/requirement-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing requirement evaluation logic...');
  
  // Find the CS degree
  const csDegree = await prisma.degree.findFirst({
    where: {
      name: {
        contains: 'Honours Computer Science'
      }
    }
  });
  
  if (!csDegree) {
    throw new Error('Computer Science degree not found. Run add-complex-requirements.ts first');
  }
  
  // Create a test user if it doesn't exist
  let testUser = await prisma.user.findFirst({
    where: {
      email: 'test@example.com'
    }
  });
  
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com'
      }
    });
    console.log('Created test user');
  }
  
  // Create a test plan
  const testPlan = await prisma.plan.create({
    data: {
      name: 'Test CS Plan',
      userId: testUser.id,
      academicCalendarYear: '2024-2025'
    }
  });
  console.log(`Created test plan: ${testPlan.name} (${testPlan.id})`);
  
  // Add CS degree to the plan
  const testPlanDegree = await prisma.planDegree.create({
    data: {
      planId: testPlan.id,
      degreeId: csDegree.id,
      type: 'MAJOR'
    }
  });
  console.log(`Added CS degree to plan as MAJOR`);
  
  // Get all CS courses
  const csCourses = await prisma.course.findMany({
    where: {
      courseCode: 'CS'
    }
  });
  
  // Get all MATH courses
  const mathCourses = await prisma.course.findMany({
    where: {
      courseCode: 'MATH'
    }
  });
  
  // Get communications courses
  const commsCourses = await prisma.course.findMany({
    where: {
      OR: [
        { courseCode: 'ENGL' },
        { courseCode: 'SPCOM' }
      ]
    }
  });
  
  // Add completed CS courses to plan
  for (const course of csCourses.slice(0, 3)) { // First 3 courses completed with good grades
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: course.id,
        status: 'COMPLETED',
        grade: 'A',
        numericGrade: 85,
        term: '1A',
        termIndex: 1
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to plan as COMPLETED with A`);
  }
  
  // Add CS 246 with minimum grade requirement
  const cs246 = csCourses.find(c => c.catalogNumber === '246');
  if (cs246) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: cs246.id,
        status: 'COMPLETED',
        grade: 'C',
        numericGrade: 65, // Just above the 60% minimum
        term: '2A',
        termIndex: 3
      }
    });
    console.log(`Added ${cs246.courseCode} ${cs246.catalogNumber} to plan as COMPLETED with C (65%)`);
  }
  
  // Add CS 341 for concurrency requirement
  const cs341 = csCourses.find(c => c.catalogNumber === '341');
  if (cs341) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: cs341.id,
        status: 'IN_PROGRESS',
        term: '3A',
        termIndex: 5
      }
    });
    console.log(`Added ${cs341.courseCode} ${cs341.catalogNumber} to plan as IN_PROGRESS`);
  }
  
  // Add a failed CS course
  const cs370 = csCourses.find(c => c.catalogNumber === '370');
  if (cs370) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: cs370.id,
        status: 'COMPLETED',
        grade: 'F',
        numericGrade: 45,
        term: '2B',
        termIndex: 4
      }
    });
    console.log(`Added ${cs370.courseCode} ${cs370.catalogNumber} to plan as FAILED`);
  }
  
  // Add 400-level CS courses for advanced requirement
  for (const course of csCourses.filter(c => parseInt(c.catalogNumber) >= 400).slice(0, 2)) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: course.id,
        status: 'COMPLETED',
        grade: 'B+',
        numericGrade: 78,
        term: '4A',
        termIndex: 7
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to plan as COMPLETED with B+`);
  }
  
  // Add MATH courses
  for (const course of mathCourses.slice(0, 4)) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: course.id,
        status: 'COMPLETED',
        grade: 'B',
        numericGrade: 75,
        term: '1B',
        termIndex: 2
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to plan as COMPLETED with B`);
  }
  
  // Add MATH 239 for concurrency requirement (same term as CS 341)
  const math239 = mathCourses.find(c => c.catalogNumber === '239');
  if (math239) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: math239.id,
        status: 'IN_PROGRESS',
        term: '3A', // Same term as CS 341
        termIndex: 5
      }
    });
    console.log(`Added ${math239.courseCode} ${math239.catalogNumber} to plan as IN_PROGRESS in same term as CS 341`);
  }
  
  // Add a communications course
  if (commsCourses.length > 0) {
    await prisma.planCourse.create({
      data: {
        planId: testPlan.id,
        courseId: commsCourses[0].id,
        status: 'COMPLETED',
        grade: 'B+',
        numericGrade: 78,
        term: '1A',
        termIndex: 1
      }
    });
    console.log(`Added ${commsCourses[0].courseCode} ${commsCourses[0].catalogNumber} to plan as COMPLETED with B+`);
  }
  
  // Update all requirements for the plan
  console.log('\nUpdating all requirements for the plan...');
  const results = await updateAllRequirementsForPlan(prisma, testPlan.id);
  
  // Fetch the updated requirements to display progress
  const planRequirements = await prisma.planRequirement.findMany({
    where: {
      planDegree: {
        planId: testPlan.id
      }
    },
    include: {
      requirement: true
    }
  });
  
  console.log('\nRequirement evaluation results:');
  for (const planReq of planRequirements) {
    console.log(`- ${planReq.requirement.name} (${planReq.requirement.type})`);
    console.log(`  Status: ${planReq.status}, Progress: ${planReq.progress}%`);
  }
  
  console.log('\nTest completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });