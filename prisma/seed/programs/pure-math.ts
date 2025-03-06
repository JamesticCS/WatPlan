import { PrismaClient } from '@prisma/client';

export async function seedPureMathProgram(prisma: PrismaClient) {
  console.log('Seeding Pure Mathematics program requirements...');
  
  // First, get the Pure Math program
  const pureMathProgram = await prisma.program.findFirst({
    where: {
      name: 'Pure Mathematics'
    }
  });

  if (!pureMathProgram) {
    throw new Error('Pure Mathematics program not found');
  }

  // Get or create the Pure Math major degree
  let pureMathDegree = await prisma.degree.findFirst({
    where: {
      name: 'Honours Pure Mathematics',
      programId: pureMathProgram.id
    }
  });

  if (!pureMathDegree) {
    pureMathDegree = await prisma.degree.create({
      data: {
        name: 'Honours Pure Mathematics',
        description: 'Honours Pure Mathematics program requirements',
        programId: pureMathProgram.id
      }
    });
  }

  // Create requirement sets
  const coreMathSet = await prisma.degreeRequirementSet.create({
    data: {
      name: 'Core Mathematics Courses',
      description: 'Required mathematics courses for the Pure Mathematics program',
      degreeId: pureMathDegree.id
    }
  });

  const additionalRequirementsSet = await prisma.degreeRequirementSet.create({
    data: {
      name: 'Additional Requirements',
      description: 'Additional requirements for the Pure Mathematics program',
      degreeId: pureMathDegree.id
    }
  });
  
  const degreeRequirementsSet = await prisma.degreeRequirementSet.create({
    data: {
      name: 'Degree Requirements',
      description: 'Overall degree requirements for Pure Mathematics',
      degreeId: pureMathDegree.id
    }
  });

  // Create core PMATH requirements 
  const corePMATHRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Required Pure Mathematics Courses',
      description: 'Core pure mathematics courses required for the Pure Mathematics degree',
      requirementSetId: coreMathSet.id,
      type: 'COURSE_LIST',
      coursesRequired: 5,
      unitsRequired: 2.5,
    }
  });

  // Find all the required PMATH courses that have already been created in the courses.ts file
  const corePMATHCodes = [
    { code: 'PMATH', num: '347' },
    { code: 'PMATH', num: '348' },
    { code: 'PMATH', num: '351' },
    { code: 'PMATH', num: '352' },
    { code: 'PMATH', num: '450' }
  ];

  // Fetch the courses
  const createdCourses = [];
  for (const courseInfo of corePMATHCodes) {
    const course = await prisma.course.findUnique({
      where: {
        courseCode_catalogNumber: {
          courseCode: courseInfo.code,
          catalogNumber: courseInfo.num
        }
      }
    });
    
    if (!course) {
      throw new Error(`Course ${courseInfo.code} ${courseInfo.num} not found in database`);
    }
    
    createdCourses.push(course);
    
    // Link to requirement
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: corePMATHRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${courseInfo.code} ${courseInfo.num} to core PMATH requirements`);
  }

  // Get the substitution courses (already created in courses.ts)
  const pmath331 = await prisma.course.findUnique({
    where: {
      courseCode_catalogNumber: {
        courseCode: 'PMATH',
        catalogNumber: '331'
      }
    }
  });

  const pmath332 = await prisma.course.findUnique({
    where: {
      courseCode_catalogNumber: {
        courseCode: 'PMATH',
        catalogNumber: '332'
      }
    }
  });
  
  if (!pmath331 || !pmath332) {
    throw new Error('Substitution courses PMATH 331 or 332 not found in database');
  }

  const pmath351 = createdCourses.find(c => c.courseCode === 'PMATH' && c.catalogNumber === '351');

  if (pmath331 && pmath351) {
    await prisma.courseSubstitution.create({
      data: {
        originalCourseId: pmath331.id,
        substituteCourseId: pmath351.id,
        requirementId: corePMATHRequirement.id
      }
    });
    console.log('Added substitution: PMATH 351 can substitute for PMATH 331');
  } else {
    console.log('Could not create substitution for PMATH 331/351');
  }

  // Get the PMATH 352 course for substitution
  const pmath352 = createdCourses.find(c => c.courseCode === 'PMATH' && c.catalogNumber === '352');

  if (pmath332 && pmath352) {
    await prisma.courseSubstitution.create({
      data: {
        originalCourseId: pmath332.id,
        substituteCourseId: pmath352.id,
        requirementId: corePMATHRequirement.id
      }
    });
    console.log('Added substitution: PMATH 352 can substitute for PMATH 332');
  } else {
    console.log('Could not create substitution for PMATH 332/352');
  }

  // Create advanced PMATH requirement
  const advancedPMATHRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Advanced Pure Mathematics Courses',
      description: 'Complete 1.5 units of PMATH courses at the 400-level',
      requirementSetId: coreMathSet.id,
      type: 'UNITS',
      unitsRequired: 1.5,
      courseCodeRestriction: 'PMATH',
      levelRestriction: '400'
    }
  });

  // Create subject concentration requirement
  const subjectConcentrationRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Subject Concentration',
      description: 'Complete 4 additional courses, all from any one (and only one) of the following subject codes: STAT, CS, CO, AMATH',
      requirementSetId: additionalRequirementsSet.id,
      type: 'COURSE_LIST',
      coursesRequired: 4,
      unitsRequired: 2.0,
      courseCodeRestriction: 'STAT, CS, CO, AMATH',
      concentrationType: 'SINGLE_SUBJECT',
      minCoursesPerSubject: 4
    }
  });
  
  // Define concentration course codes to link to the requirement
  const concentrationCourses = [
    // CS courses
    { code: 'CS', num: '240' },
    { code: 'CS', num: '245' },
    // STAT courses
    { code: 'STAT', num: '231' },
    { code: 'STAT', num: '330' },
    // CO courses
    { code: 'CO', num: '250' },
    { code: 'CO', num: '342' },
    // AMATH courses
    { code: 'AMATH', num: '231' },
    { code: 'AMATH', num: '250' }
  ];

  // Find the courses and link them to the concentration requirement
  for (const courseInfo of concentrationCourses) {
    const course = await prisma.course.findUnique({
      where: {
        courseCode_catalogNumber: {
          courseCode: courseInfo.code,
          catalogNumber: courseInfo.num
        }
      }
    });
    
    if (!course) {
      console.warn(`Warning: Course ${courseInfo.code} ${courseInfo.num} not found, skipping`);
      continue;
    }
    
    // Link the course to the concentration requirement (but not as required)
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: subjectConcentrationRequirement.id,
        courseId: course.id,
        isRequired: false // Not specifically required, just eligible
      }
    });
    
    console.log(`Added ${courseInfo.code} ${courseInfo.num} to subject concentration options`);
  }

  // Create multi-list requirement example (like complementary studies)
  const complementaryStudiesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Complementary Studies Electives',
      description: 'Complete three Complementary Studies Electives from the specified lists',
      requirementSetId: additionalRequirementsSet.id,
      type: 'MULTI_LIST',
      coursesRequired: 3,
      unitsRequired: 1.5
    }
  });

  // Create the lists for complementary studies
  const listA = await prisma.requirementList.create({
    data: {
      name: 'List A: Impact of Technology on Society',
      description: 'Courses focusing on the impact of technology on society',
      requirementId: complementaryStudiesRequirement.id
    }
  });

  const listC = await prisma.requirementList.create({
    data: {
      name: 'List C: Humanities and Social Sciences',
      description: 'Courses in humanities and social sciences',
      requirementId: complementaryStudiesRequirement.id
    }
  });

  const listD = await prisma.requirementList.create({
    data: {
      name: 'List D: Business and Entrepreneurship',
      description: 'Courses in business and entrepreneurship',
      requirementId: complementaryStudiesRequirement.id
    }
  });

  // Define the courses for each list
  const complementaryCoursesData = {
    listA: [
      { code: 'STV', num: '202' },
      { code: 'STV', num: '205' }
    ],
    listC: [
      { code: 'PHIL', num: '145' },
      { code: 'PHIL', num: '256' },
      { code: 'ENGL', num: '210F' }
    ],
    listD: [
      { code: 'BUS', num: '111W' },
      { code: 'BUS', num: '121W' },
      { code: 'ECON', num: '101' }
    ]
  };

  // Process each list and its courses
  const listsMap: Record<string, any> = {
    'listA': listA,
    'listC': listC,
    'listD': listD
  };

  for (const [listName, courses] of Object.entries(complementaryCoursesData)) {
    const listId = listsMap[listName].id;
    
    for (const courseInfo of courses) {
      // Find the course
      const course = await prisma.course.findUnique({
        where: {
          courseCode_catalogNumber: {
            courseCode: courseInfo.code,
            catalogNumber: courseInfo.num
          }
        }
      });
      
      if (!course) {
        console.warn(`Warning: Course ${courseInfo.code} ${courseInfo.num} not found, skipping`);
        continue;
      }
      
      // Link to the appropriate list
      await prisma.requirementListCourse.create({
        data: {
          listId: listId,
          courseId: course.id
        }
      });
      
      console.log(`Added ${courseInfo.code} ${courseInfo.num} to ${listName}`);
    }
  }

  // Add degree-level requirements
  // Total Math Units Requirement
  const totalMathUnitsRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Total Mathematics Units',
      description: 'Complete a minimum of 13.0 units of math courses',
      requirementSetId: degreeRequirementsSet.id,
      type: 'UNITS',
      unitsRequired: 13.0,
      courseCodeRestriction: 'ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT'
    }
  });
  
  // Non-Math Units Requirement
  const nonMathUnitsRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Non-Mathematics Units',
      description: 'Complete a minimum of 5.0 units of non-math courses',
      requirementSetId: degreeRequirementsSet.id,
      type: 'UNITS',
      unitsRequired: 5.0
    }
  });
  
  // Add required math courses
  const mathCoursesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Required Math Courses',
      description: 'Complete the following required math courses',
      requirementSetId: coreMathSet.id,
      type: 'COURSE_LIST',
      coursesRequired: 5,
      unitsRequired: 2.5
    }
  });
  
  // Define required MATH courses
  const coreMathCourses = [
    { code: 'MATH', num: '135' },
    { code: 'MATH', num: '136' },
    { code: 'MATH', num: '137' },
    { code: 'MATH', num: '138' },
    { code: 'MATH', num: '235' }
  ];
  
  // Link each required math course to the requirement
  for (const courseInfo of coreMathCourses) {
    // Find the course
    const course = await prisma.course.findUnique({
      where: {
        courseCode_catalogNumber: {
          courseCode: courseInfo.code,
          catalogNumber: courseInfo.num
        }
      }
    });
    
    if (!course) {
      console.warn(`Warning: Course ${courseInfo.code} ${courseInfo.num} not found, skipping`);
      continue;
    }
    
    // Link to requirement
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: mathCoursesRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${courseInfo.code} ${courseInfo.num} to required math courses`);
  }

  console.log('Seeded Pure Mathematics program requirements');
}