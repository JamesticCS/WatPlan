import { PrismaClient } from '@prisma/client';

export async function seedRequirements(prisma: PrismaClient) {
  console.log('Seeding requirements...');
  
  // Get one degree to add detailed requirements (Mathematical Physics)
  const mathPhysicsDegree = await prisma.degree.findFirst({
    where: {
      program: {
        name: 'Mathematical Physics'
      }
    },
    include: {
      requirementSets: true
    }
  });
  
  if (!mathPhysicsDegree || mathPhysicsDegree.requirementSets.length < 2) {
    throw new Error('Mathematical Physics degree or requirement sets not found');
  }
  
  const coreSetId = mathPhysicsDegree.requirementSets[0].id;
  const additionalSetId = mathPhysicsDegree.requirementSets[1].id;
  
  // Add core requirements
  const mathRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Required Mathematics Courses',
      description: 'Core mathematics courses required for the Mathematical Physics degree',
      requirementSetId: coreSetId,
      type: 'COURSE_LIST',
      coursesRequired: 7,
      unitsRequired: 3.5,
    }
  });
  
  const physicsRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Required Physics Courses',
      description: 'Core physics courses required for the Mathematical Physics degree',
      requirementSetId: coreSetId,
      type: 'COURSE_LIST',
      coursesRequired: 6,
      unitsRequired: 3.0,
    }
  });
  
  const additionalMathPhysRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Additional AMATH or PHYS Courses',
      description: 'Complete 3.5 units of additional AMATH or PHYS courses, with a minimum of 1.0 unit at the 300- or 400-level',
      requirementSetId: additionalSetId,
      type: 'UNITS',
      unitsRequired: 3.5,
      levelRestriction: '300-400',
      courseCodeRestriction: 'AMATH, PHYS',
    }
  });
  
  const communicationRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Communication Requirement',
      description: 'Communication courses required for all Mathematics degrees',
      requirementSetId: additionalSetId,
      type: 'COURSE_LIST',
      coursesRequired: 1,
      unitsRequired: 0.5,
    }
  });
  
  // Find math courses
  const mathCourses = await prisma.course.findMany({
    where: {
      courseCode: 'MATH',
    }
  });
  
  // Find physics courses
  const physicsCourses = await prisma.course.findMany({
    where: {
      courseCode: 'PHYS',
    }
  });
  
  // Find communication course
  const englCourse = await prisma.course.findFirst({
    where: {
      courseCode: 'ENGL',
      catalogNumber: '192',
    }
  });
  
  if (!englCourse) {
    throw new Error('ENGL 192 course not found');
  }
  
  // Add math courses to math requirement
  for (const course of mathCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: mathRequirement.id,
        courseId: course.id,
        isRequired: true,
      }
    });
  }
  
  // Add physics courses to physics requirement
  for (const course of physicsCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: physicsRequirement.id,
        courseId: course.id,
        isRequired: true,
      }
    });
  }
  
  // Add ENGL course to communication requirement
  await prisma.degreeRequirementCourse.create({
    data: {
      requirementId: communicationRequirement.id,
      courseId: englCourse.id,
      isRequired: true,
    }
  });
  
  console.log('Seeded requirements for Mathematical Physics degree');
}