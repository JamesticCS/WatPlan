import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('Adding sample faculty data...');
    // Add Faculty
    const mathFaculty = await prisma.faculty.create({
      data: {
        name: 'Mathematics',
        description: 'Faculty of Mathematics at the University of Waterloo',
      },
    });

    console.log('Adding sample program data...');
    // Add Program
    const csProgram = await prisma.program.create({
      data: {
        name: 'Computer Science',
        description: 'Study of computation, algorithms, and programming',
        facultyId: mathFaculty.id,
      },
    });

    console.log('Adding sample degree data...');
    // Add Degree
    const bcsHonors = await prisma.degree.create({
      data: {
        name: 'Bachelor of Computer Science (Honours)',
        description: 'Honours Bachelor of Computer Science degree',
        programId: csProgram.id,
      },
    });

    console.log('Adding sample courses...');
    // Add Courses
    const cs135 = await prisma.course.create({
      data: {
        courseCode: 'CS',
        catalogNumber: '135',
        title: 'Designing Functional Programs',
        description: 'An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming.',
        units: 0.5,
      },
    });

    const cs136 = await prisma.course.create({
      data: {
        courseCode: 'CS',
        catalogNumber: '136',
        title: 'Elementary Algorithm Design and Data Abstraction',
        description: 'This course builds on the techniques and patterns learned in CS 135 while making the transition to use of an imperative language.',
        units: 0.5,
        prerequisites: 'CS 135',
      },
    });

    const math135 = await prisma.course.create({
      data: {
        courseCode: 'MATH',
        catalogNumber: '135',
        title: 'Algebra for Honours Mathematics',
        description: 'Introduction to the language of mathematics and proof techniques through a study of the basic algebraic systems of mathematics.',
        units: 0.5,
      },
    });

    const math137 = await prisma.course.create({
      data: {
        courseCode: 'MATH',
        catalogNumber: '137',
        title: 'Calculus 1 for Honours Mathematics',
        description: 'Limits, continuity, differentiability. Fundamental theorem of calculus, integration.',
        units: 0.5,
      },
    });

    console.log('Adding sample requirements...');
    // Add Requirement Set
    const coreReqSet = await prisma.degreeRequirementSet.create({
      data: {
        name: 'Core Requirements',
        description: 'Core courses required for the BCS degree',
        degreeId: bcsHonors.id,
      },
    });

    // Add Requirements
    const coreCSReq = await prisma.degreeRequirement.create({
      data: {
        name: 'Core CS Courses',
        description: 'Fundamental CS courses required for the degree',
        type: 'COURSE_LIST',
        coursesRequired: 2,
        requirementSetId: coreReqSet.id,
      },
    });

    const coreMathReq = await prisma.degreeRequirement.create({
      data: {
        name: 'Core Math Courses',
        description: 'Fundamental Math courses required for the degree',
        type: 'COURSE_LIST',
        coursesRequired: 2,
        requirementSetId: coreReqSet.id,
      },
    });

    // Link Courses to Requirements
    await prisma.degreeRequirementCourse.createMany({
      data: [
        {
          requirementId: coreCSReq.id,
          courseId: cs135.id,
          isRequired: true,
        },
        {
          requirementId: coreCSReq.id,
          courseId: cs136.id,
          isRequired: true,
        },
        {
          requirementId: coreMathReq.id,
          courseId: math135.id,
          isRequired: true,
        },
        {
          requirementId: coreMathReq.id,
          courseId: math137.id,
          isRequired: true,
        },
      ],
    });

    console.log('Sample data added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addSampleData();