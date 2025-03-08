/**
 * Script to add complex degree and program requirements for testing
 */

import { PrismaClient } from '@prisma/client';

// Define requirement types inline to avoid import issues
const RequirementType = {
  COURSE: 'COURSE',
  COURSE_LIST: 'COURSE_LIST',
  UNITS: 'UNITS',
  MULTI_LIST: 'MULTI_LIST',
  MIN_GRADE: 'MIN_GRADE',
  MIN_AVERAGE: 'MIN_AVERAGE',
  MAX_FAILURES: 'MAX_FAILURES',
  CUSTOM: 'CUSTOM'
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('Creating complex program requirements for testing...');
  
  // Find or create Computer Science program and degree
  // ==================================================
  
  // Find the Faculty of Mathematics
  let mathFaculty = await prisma.faculty.findFirst({
    where: {
      name: {
        contains: 'Mathematics'
      }
    }
  });
  
  if (!mathFaculty) {
    mathFaculty = await prisma.faculty.create({
      data: {
        name: 'Faculty of Mathematics',
        description: 'The Faculty of Mathematics at the University of Waterloo'
      }
    });
    console.log('Created Faculty of Mathematics');
  }
  
  // Find or create Computer Science program
  let csProgram = await prisma.program.findFirst({
    where: {
      name: 'Computer Science',
      facultyId: mathFaculty.id
    }
  });
  
  if (!csProgram) {
    csProgram = await prisma.program.create({
      data: {
        name: 'Computer Science',
        description: 'Bachelor of Computer Science program',
        facultyId: mathFaculty.id
      }
    });
    console.log('Created Computer Science program');
  }
  
  // Find or create CS degree
  let csDegree = await prisma.degree.findFirst({
    where: {
      name: 'Honours Computer Science',
      programId: csProgram.id
    }
  });
  
  if (!csDegree) {
    csDegree = await prisma.degree.create({
      data: {
        name: 'Honours Computer Science',
        description: 'Honours Computer Science degree',
        programId: csProgram.id
      }
    });
    console.log('Created Honours Computer Science degree');
  }
  
  // Create Computer Science requirement sets
  // =======================================
  
  // Find or create requirement sets for CS program
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
    console.log('Created Core CS Requirements set');
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
    console.log('Created Advanced CS Requirements set');
  }
  
  let genEdRequirementSet = await prisma.degreeRequirementSet.findFirst({
    where: {
      name: 'General Education Requirements',
      degreeId: csDegree.id
    }
  });
  
  if (!genEdRequirementSet) {
    genEdRequirementSet = await prisma.degreeRequirementSet.create({
      data: {
        name: 'General Education Requirements',
        description: 'General education requirements for Computer Science',
        degreeId: csDegree.id,
        academicCalendarYear: '2024-2025'
      }
    });
    console.log('Created General Education Requirements set');
  }
  
  // Create Computer Science requirement examples
  // ============================================
  
  // Track created requirements for summary
  const createdRequirements = [];
  
  // 1. Core CS courses requirement (simple list of required courses)
  const coreCSCoursesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Core CS Courses',
      description: 'All Computer Science students must complete these core CS courses.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 5,
      unitsRequired: 2.5
    }
  });
  createdRequirements.push(coreCSCoursesRequirement);
  console.log(`Created requirement: ${coreCSCoursesRequirement.name}`);
  
  // Find core CS courses
  const csCourses = await prisma.course.findMany({
    where: {
      courseCode: 'CS',
      catalogNumber: {
        in: ['135', '136', '240', '241', '245']
      }
    }
  });
  
  // Link courses to the requirement
  for (const course of csCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: coreCSCoursesRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to ${coreCSCoursesRequirement.name}`);
  }
  
  // 2. Math courses requirement
  const mathRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Required Math Courses',
      description: 'All Computer Science students must complete these math courses.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 7,
      unitsRequired: 3.5
    }
  });
  createdRequirements.push(mathRequirement);
  console.log(`Created requirement: ${mathRequirement.name}`);
  
  // Find math courses
  const mathCourses = await prisma.course.findMany({
    where: {
      courseCode: 'MATH',
      catalogNumber: {
        in: ['135', '136', '137', '138', '239']
      }
    }
  });
  
  const statCourses = await prisma.course.findMany({
    where: {
      courseCode: 'STAT',
      catalogNumber: {
        in: ['230', '231']
      }
    }
  });
  
  // Link math and stat courses to the requirement
  for (const course of [...mathCourses, ...statCourses]) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: mathRequirement.id,
        courseId: course.id,
        isRequired: true
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to ${mathRequirement.name}`);
  }
  
  // 3. Advanced CS requirement (level restriction)
  const advancedCSRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Advanced CS Courses',
      description: 'Complete 1.5 units of CS courses at the 400-level.',
      requirementSetId: advancedRequirementSet.id,
      type: RequirementType.UNITS,
      unitsRequired: 1.5,
      courseCodeRestriction: 'CS',
      levelRestriction: '400'
    }
  });
  createdRequirements.push(advancedCSRequirement);
  console.log(`Created requirement: ${advancedCSRequirement.name}`);
  
  // 4. Additional CS requirement (take N of these courses)
  const additionalCSRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Additional CS Courses',
      description: 'Take 2 of the following courses.',
      requirementSetId: advancedRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 2,
      unitsRequired: 1.0
    }
  });
  createdRequirements.push(additionalCSRequirement);
  console.log(`Created requirement: ${additionalCSRequirement.name}`);
  
  // Find additional CS courses
  const additionalCsCourses = await prisma.course.findMany({
    where: {
      courseCode: 'CS',
      catalogNumber: {
        in: ['341', '350', '370', '456', '486']
      }
    }
  });
  
  // Link additional CS courses to the requirement
  for (const course of additionalCsCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: additionalCSRequirement.id,
        courseId: course.id,
        isRequired: false // Only need to take 2 of these, not all
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to ${additionalCSRequirement.name}`);
  }
  
  // 5. Communications requirement (take one of these courses)
  const communicationsRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Communications Requirement',
      description: 'Take one of the following communications courses.',
      requirementSetId: genEdRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 1,
      unitsRequired: 0.5
    }
  });
  createdRequirements.push(communicationsRequirement);
  console.log(`Created requirement: ${communicationsRequirement.name}`);
  
  // Find communication courses
  const commsCourses = await prisma.course.findMany({
    where: {
      courseCode: {
        in: ['ENGL', 'SPCOM']
      },
      catalogNumber: {
        in: ['109', '192', '100', '223']
      }
    }
  });
  
  // Link communication courses to the requirement
  for (const course of commsCourses) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: communicationsRequirement.id,
        courseId: course.id,
        isRequired: false // Only need to take 1 of these, not all
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to ${communicationsRequirement.name}`);
  }
  
  // 6. Humanities/social science electives requirement (level restriction with units)
  const humanitiesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Humanities and Social Science Electives',
      description: 'Complete 1.0 units of courses from humanities or social science departments.',
      requirementSetId: genEdRequirementSet.id,
      type: RequirementType.UNITS,
      unitsRequired: 1.0,
      courseCodeRestriction: 'ENGL, PHIL, HIST, PSYCH, ECON'
    }
  });
  createdRequirements.push(humanitiesRequirement);
  console.log(`Created requirement: ${humanitiesRequirement.name}`);
  
  // 7. Course with min grade requirement
  const cs246MinGradeRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'CS 246 Minimum Grade',
      description: 'Complete CS 246 with a minimum grade of 60%.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MIN_GRADE,
      minGradeRequired: 60
    }
  });
  createdRequirements.push(cs246MinGradeRequirement);
  console.log(`Created requirement: ${cs246MinGradeRequirement.name}`);
  
  // Find CS 246
  const cs246 = await prisma.course.findFirst({
    where: {
      courseCode: 'CS',
      catalogNumber: '246'
    }
  });
  
  if (cs246) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: cs246MinGradeRequirement.id,
        courseId: cs246.id,
        isRequired: true
      }
    });
    console.log(`Added ${cs246.courseCode} ${cs246.catalogNumber} to ${cs246MinGradeRequirement.name}`);
  }
  
  // 8. Average requirement
  const csAverageRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'CS Average Requirement',
      description: 'Maintain a minimum 65% average in all CS courses.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MIN_AVERAGE,
      minAverage: 65,
      courseCodeRestriction: 'CS'
    }
  });
  createdRequirements.push(csAverageRequirement);
  console.log(`Created requirement: ${csAverageRequirement.name}`);
  
  // 9. Failure limit requirement
  const maxFailuresRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Maximum Failures',
      description: 'A maximum of two failures in CS courses are allowed.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.MAX_FAILURES,
      maxFailures: 2,
      failureRestriction: 'CS'
    }
  });
  createdRequirements.push(maxFailuresRequirement);
  console.log(`Created requirement: ${maxFailuresRequirement.name}`);
  
  // 10. Multi-list requirement
  const complementaryStudiesRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'Complementary Studies',
      description: 'Complete three courses from the following lists: one from List A, one from List B, and one from List C.',
      requirementSetId: genEdRequirementSet.id,
      type: RequirementType.MULTI_LIST,
      coursesRequired: 3,
      unitsRequired: 1.5
    }
  });
  createdRequirements.push(complementaryStudiesRequirement);
  console.log(`Created requirement: ${complementaryStudiesRequirement.name}`);
  
  // Create the lists
  const listA = await prisma.requirementList.create({
    data: {
      name: 'List A: Impact of Technology',
      description: 'Courses focusing on the impact of technology on society.',
      requirementId: complementaryStudiesRequirement.id
    }
  });
  
  const listB = await prisma.requirementList.create({
    data: {
      name: 'List B: Humanities',
      description: 'Humanities courses.',
      requirementId: complementaryStudiesRequirement.id
    }
  });
  
  const listC = await prisma.requirementList.create({
    data: {
      name: 'List C: Social Sciences',
      description: 'Social science courses.',
      requirementId: complementaryStudiesRequirement.id
    }
  });
  
  // Find list A courses
  const listACourses = await prisma.course.findMany({
    where: {
      courseCode: 'STV'
    },
    take: 2
  });
  
  // Find list B courses
  const listBCourses = await prisma.course.findMany({
    where: {
      courseCode: {
        in: ['ENGL', 'PHIL']
      }
    },
    take: 3
  });
  
  // Find list C courses
  const listCCourses = await prisma.course.findMany({
    where: {
      courseCode: {
        in: ['PSYCH', 'ECON']
      }
    },
    take: 3
  });
  
  // Link courses to lists
  for (const course of listACourses) {
    await prisma.requirementListCourse.create({
      data: {
        listId: listA.id,
        courseId: course.id
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to List A`);
  }
  
  for (const course of listBCourses) {
    await prisma.requirementListCourse.create({
      data: {
        listId: listB.id,
        courseId: course.id
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to List B`);
  }
  
  for (const course of listCCourses) {
    await prisma.requirementListCourse.create({
      data: {
        listId: listC.id,
        courseId: course.id
      }
    });
    console.log(`Added ${course.courseCode} ${course.catalogNumber} to List C`);
  }
  
  // 11. Course with allowed substitution
  const mathSubstitutionRequirement = await prisma.degreeRequirement.create({
    data: {
      name: 'MATH Substitution Requirement',
      description: 'Complete MATH 135 or a permitted substitute course.',
      requirementSetId: coreRequirementSet.id,
      type: RequirementType.COURSE_LIST,
      coursesRequired: 1,
      unitsRequired: 0.5
    }
  });
  createdRequirements.push(mathSubstitutionRequirement);
  console.log(`Created requirement: ${mathSubstitutionRequirement.name}`);
  
  // Find MATH 135 and MATH 145
  const math135 = await prisma.course.findFirst({
    where: {
      courseCode: 'MATH',
      catalogNumber: '135'
    }
  });
  
  const math145 = await prisma.course.findFirst({
    where: {
      courseCode: 'MATH',
      catalogNumber: '145'
    }
  });
  
  // Add MATH 135 as primary course
  if (math135) {
    await prisma.degreeRequirementCourse.create({
      data: {
        requirementId: mathSubstitutionRequirement.id,
        courseId: math135.id,
        isRequired: true
      }
    });
    console.log(`Added ${math135.courseCode} ${math135.catalogNumber} to ${mathSubstitutionRequirement.name}`);
  }
  
  // Add MATH 145 as substitution for MATH 135
  if (math135 && math145) {
    await prisma.courseSubstitution.create({
      data: {
        originalCourseId: math135.id,
        substituteCourseId: math145.id,
        requirementId: mathSubstitutionRequirement.id
      }
    });
    console.log(`Added substitution: ${math145.courseCode} ${math145.catalogNumber} can substitute for ${math135.courseCode} ${math135.catalogNumber}`);
  }
  
  // Summary of created requirements
  console.log('\nCreated requirements for Computer Science:');
  for (const req of createdRequirements) {
    console.log(`- ${req.name} (${req.type})`);
  }
  
  // Find or create Pure Mathematics program and degree
  // =================================================
  
  // Find or create Pure Mathematics program
  let pmathProgram = await prisma.program.findFirst({
    where: {
      name: 'Pure Mathematics',
      facultyId: mathFaculty.id
    }
  });
  
  if (!pmathProgram) {
    pmathProgram = await prisma.program.create({
      data: {
        name: 'Pure Mathematics',
        description: 'Pure Mathematics program',
        facultyId: mathFaculty.id
      }
    });
    console.log('Created Pure Mathematics program');
  }
  
  // Find or create Pure Mathematics degree
  let pmathDegree = await prisma.degree.findFirst({
    where: {
      name: 'Honours Pure Mathematics',
      programId: pmathProgram.id
    }
  });
  
  if (!pmathDegree) {
    pmathDegree = await prisma.degree.create({
      data: {
        name: 'Honours Pure Mathematics',
        description: 'Honours Pure Mathematics degree',
        programId: pmathProgram.id
      }
    });
    console.log('Created Honours Pure Mathematics degree');
  }
  
  console.log('\nProgram requirements created successfully!');
}

main()
  .catch(error => console.error(error))
  .finally(async () => {
    await prisma.$disconnect();
  });