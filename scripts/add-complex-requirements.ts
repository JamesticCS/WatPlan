import { PrismaClient } from '@prisma/client';
import { RequirementType } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating complex requirement examples...');
  
  // Find the Computer Science program
  let csProgram = await prisma.program.findFirst({
    where: {
      name: {
        contains: 'Computer Science'
      }
    }
  });
  
  if (!csProgram) {
    console.log('Computer Science program not found, creating it...');
    
    // Find Faculty of Mathematics
    const mathFaculty = await prisma.faculty.findFirst({
      where: {
        name: {
          contains: 'Mathematics'
        }
      }
    });
    
    if (!mathFaculty) {
      throw new Error('Mathematics faculty not found');
    }
    
    // Create CS program
    const newCsProgram = await prisma.program.create({
      data: {
        name: 'Computer Science',
        description: 'Bachelor of Computer Science program',
        facultyId: mathFaculty.id
      }
    });
    
    console.log('Created Computer Science program');
    
    // Use the newly created program
    csProgram = newCsProgram;
  }
  
  // Find or create CS degree
  let csDegree = await prisma.degree.findFirst({
    where: {
      name: {
        contains: 'Honours Computer Science'
      },
      programId: csProgram.id
    }
  });
  
  if (!csDegree) {
    console.log('CS degree not found, creating it...');
    
    csDegree = await prisma.degree.create({
      data: {
        name: 'Honours Computer Science',
        description: 'Honours Computer Science degree',
        programId: csProgram.id
      }
    });
    
    console.log('Created CS degree');
  }
  
  // Create requirement sets
  let coreRequirementSet = await prisma.degreeRequirementSet.findFirst({
    where: {
      name: 'Core CS Requirements',
      degreeId: csDegree.id
    }
  });
  
  if (!coreRequirementSet) {
    coreRequirementSet = await prisma.degreeRequirementSet.create({
      data: {
        name: 'Core CS Requirements',
        description: 'Core requirements for Computer Science',
        degreeId: csDegree.id,
        academicCalendarYear: '2024-2025'
      }
    });
  }
  
  let advancedRequirementSet = await prisma.degreeRequirementSet.findFirst({
    where: {
      name: 'Advanced CS Requirements',
      degreeId: csDegree.id
    }
  });
  
  if (!advancedRequirementSet) {
    advancedRequirementSet = await prisma.degreeRequirementSet.create({
      data: {
        name: 'Advanced CS Requirements',
        description: 'Advanced requirements for Computer Science',
        degreeId: csDegree.id,
        academicCalendarYear: '2024-2025'
      }
    });
  }
  
  // Create sample courses if they don't exist
  const courseData = [
    { code: 'CS', num: '135', title: 'Designing Functional Programs', units: 0.5 },
    { code: 'CS', num: '136', title: 'Algorithm Design and Data Abstraction', units: 0.5 },
    { code: 'CS', num: '245', title: 'Logic and Computation', units: 0.5 },
    { code: 'CS', num: '246', title: 'Object-Oriented Software Development', units: 0.5 },
    { code: 'CS', num: '341', title: 'Algorithms', units: 0.5 },
    { code: 'CS', num: '350', title: 'Operating Systems', units: 0.5 },
    { code: 'CS', num: '370', title: 'Numerical Computation', units: 0.5 },
    { code: 'CS', num: '480', title: 'Introduction to Machine Learning', units: 0.5 },
    { code: 'CS', num: '486', title: 'Introduction to Artificial Intelligence', units: 0.5 },
    { code: 'MATH', num: '135', title: 'Algebra', units: 0.5 },
    { code: 'MATH', num: '136', title: 'Linear Algebra 1', units: 0.5 },
    { code: 'MATH', num: '137', title: 'Calculus 1', units: 0.5 },
    { code: 'MATH', num: '138', title: 'Calculus 2', units: 0.5 },
    { code: 'MATH', num: '239', title: 'Introduction to Combinatorics', units: 0.5 },
    { code: 'STAT', num: '230', title: 'Probability', units: 0.5 },
    { code: 'STAT', num: '231', title: 'Statistics', units: 0.5 },
    { code: 'ENGL', num: '109', title: 'Introduction to Academic Writing', units: 0.5 },
    { code: 'SPCOM', num: '100', title: 'Interpersonal Communication', units: 0.5 },
  ];
  
  const courses = [];
  
  for (const courseInfo of courseData) {
    let course = await prisma.course.findUnique({
      where: {
        courseCode_catalogNumber: {
          courseCode: courseInfo.code,
          catalogNumber: courseInfo.num
        }
      }
    });
    
    if (!course) {
      course = await prisma.course.create({
        data: {
          courseCode: courseInfo.code,
          catalogNumber: courseInfo.num,
          title: courseInfo.title,
          units: courseInfo.units,
          description: `Sample description for ${courseInfo.code} ${courseInfo.num}`
        }
      });
      console.log(`Created course: ${courseInfo.code} ${courseInfo.num}`);
    }
    
    courses.push(course);
  }
  
  // 1. Create standard course list requirement
  const csCoreCoursesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Core CS Courses',
      description: 'Complete all of the following core CS courses',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 5,
      unitsRequired: 2.5
    }
  });
  
  // Add core CS courses
  const csCourses = courses.filter(c => c.courseCode === 'CS').slice(0, 5);
  for (const course of csCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: csCoreCoursesRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to core CS requirement`);
  }
  
  // 2. Create a level-restricted requirement
  const advancedCSRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Advanced CS Courses',
      description: 'Complete 3 CS courses at the 400-level',
      requirementSetId: advancedRequirementSet.id,
      type: RequirementType.UNITS,
      unitsRequired: 1.5,
      courseCodeRestriction: 'CS',
      levelRestriction: '400'
    }
  });
  
  // 3. Create a minimum grade requirement
  const cs246MinGradeRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'CS 246 Minimum Grade',
      description: 'Complete CS 246 with a minimum grade of 60%',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MIN_GRADE,
      minGradeRequired: 60
    }
  });
  
  // Add CS 246 to the min grade requirement
  const cs246 = courses.find(c => c.courseCode === 'CS' && c.catalogNumber === '246');
  if (cs246) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: cs246MinGradeRequirement.id,
        courseId: cs246.id,
        isRequired: true
      }
    });
    console.log(`Added ${cs246.courseCode} ${cs246.catalogNumber} to min grade requirement`);
  }
  
  // 4. Create a minimum average requirement
  const csAverageRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'CS Average Requirement',
      description: 'Maintain a minimum 65% average in all CS courses',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MIN_AVERAGE,
      minAverage: 65,
      courseCodeRestriction: 'CS'
    }
  });
  
  // 5. Create a maximum failures requirement
  const maxFailuresRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Maximum Failures',
      description: 'A maximum of two failures in CS courses are allowed',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MAX_FAILURES,
      maxFailures: 2,
      failureRestriction: 'CS'
    }
  });
  
  // 6. Create a math courses requirement
  const mathCoursesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Math Courses',
      description: 'Complete all required math courses',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 7,
      unitsRequired: 3.5
    }
  });
  
  // Add math courses
  const mathCourses = courses.filter(c => c.courseCode === 'MATH' || c.courseCode === 'STAT');
  for (const course of mathCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: mathCoursesRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to math courses requirement`);
  }
  
  // 7. Create a communications requirement with multiple lists
  const communicationsRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Communications Requirement',
      description: 'Complete one communications course',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MULTI_LIST,
      coursesRequired: 1,
      unitsRequired: 0.5
    }
  });
  
  // Create the communications list
  const commsList = await prisma.requirementList.create({
    data: {
      name: 'Communications Courses',
      description: 'List of eligible communications courses',
      requirementId: communicationsRequirement.id
    }
  });
  
  // Add communications courses to the list
  const commsCourses = courses.filter(c => c.courseCode === 'ENGL' || c.courseCode === 'SPCOM');
  for (const course of commsCourses) {
    await prisma.requirementListCourse.create({
      data: {
        listId: commsList.id,
        courseId: course.id
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to communications list`);
  }
  
  // 8. Create a concurrent course requirement
  const concurrentRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'MATH 239 and CS 341 Concurrent Requirement',
      description: 'MATH 239 must be taken before or concurrently with CS 341',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.CUSTOM,
      customLogicType: 'CONCURRENT_COURSES',
      customLogicParams: JSON.stringify({
        courseIds: [
          courses.find(c => c.courseCode === 'MATH' && c.catalogNumber === '239')?.id,
          courses.find(c => c.courseCode === 'CS' && c.catalogNumber === '341')?.id
        ]
      })
    }
  });
  
  console.log('Created complex requirement examples successfully!');
  
  // Display summary
  const requirements = await prisma.degreeRequirement.findMany({
    where: {
      requirementSet: {
        degreeId: csDegree.id
      }
    }
  });
  
  console.log(`\nCreated ${requirements.length} requirements for CS degree:`);
  for (const req of requirements) {
    console.log(`- ${req.name} (${req.type})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });