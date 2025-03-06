import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addPureMathCoopData() {
  try {
    console.log('Adding Pure Mathematics Co-op program data...');
    
    // 1. Find Math Faculty
    const mathFaculty = await prisma.faculty.findFirst({
      where: { name: 'Mathematics' }
    });

    if (!mathFaculty) {
      console.error('Mathematics faculty not found');
      return;
    }
    
    // 2. Find Pure Mathematics Program
    const pureMathProgram = await prisma.program.findFirst({
      where: {
        name: 'Pure Mathematics',
        facultyId: mathFaculty.id
      }
    });

    if (!pureMathProgram) {
      console.error('Pure Mathematics program not found');
      return;
    }
    
    // 3. Add Pure Mathematics Co-op Degree if it doesn't exist
    let pureMathCoopDegree = await prisma.degree.findFirst({
      where: {
        name: 'Pure Mathematics (Co-op) 2024-2025',
        programId: pureMathProgram.id
      }
    });

    if (!pureMathCoopDegree) {
      pureMathCoopDegree = await prisma.degree.create({
        data: {
          name: 'Pure Mathematics (Co-op) 2024-2025',
          description: 'Bachelor of Mathematics in Pure Mathematics (Co-op) - 2024-2025 Academic Calendar',
          programId: pureMathProgram.id,
        },
      });
      console.log('Created Pure Mathematics (Co-op) degree');
    } else {
      console.log('Pure Mathematics (Co-op) degree already exists');
    }
    
    if (!pureMathCoopDegree) {
      console.error('Failed to create or find Pure Mathematics (Co-op) degree');
      return;
    }

    // 4. Create Requirement Sets for Co-op
    // Core Requirements
    let coopCoreRequirementSet = await prisma.degreeRequirementSet.findFirst({
      where: {
        name: 'Core Requirements',
        degreeId: pureMathCoopDegree.id,
      },
    });

    if (!coopCoreRequirementSet) {
      coopCoreRequirementSet = await prisma.degreeRequirementSet.create({
        data: {
          name: 'Core Requirements',
          description: 'Core courses required for Pure Mathematics (Co-op)',
          degreeId: pureMathCoopDegree.id,
        },
      });
      console.log('Created Core Requirements set for Co-op');
    } else {
      console.log('Core Requirements set for Co-op already exists');
    }

    // Additional Requirements
    let coopOptionalRequirementSet = await prisma.degreeRequirementSet.findFirst({
      where: {
        name: 'Additional Requirements',
        degreeId: pureMathCoopDegree.id,
      },
    });

    if (!coopOptionalRequirementSet) {
      coopOptionalRequirementSet = await prisma.degreeRequirementSet.create({
        data: {
          name: 'Additional Requirements',
          description: 'Additional requirements including course options and electives for Co-op',
          degreeId: pureMathCoopDegree.id,
        },
      });
      console.log('Created Additional Requirements set for Co-op');
    } else {
      console.log('Additional Requirements set for Co-op already exists');
    }

    // General Requirements
    let coopGeneralRequirementSet = await prisma.degreeRequirementSet.findFirst({
      where: {
        name: 'General Requirements',
        degreeId: pureMathCoopDegree.id,
      },
    });

    if (!coopGeneralRequirementSet) {
      coopGeneralRequirementSet = await prisma.degreeRequirementSet.create({
        data: {
          name: 'General Requirements',
          description: 'General degree requirements for Co-op',
          degreeId: pureMathCoopDegree.id,
        },
      });
      console.log('Created General Requirements set for Co-op');
    } else {
      console.log('General Requirements set for Co-op already exists');
    }

    // Co-op specific requirement set
    let coopWorkTermRequirementSet = await prisma.degreeRequirementSet.findFirst({
      where: {
        name: 'Co-op Requirements',
        degreeId: pureMathCoopDegree.id,
      },
    });

    if (!coopWorkTermRequirementSet) {
      coopWorkTermRequirementSet = await prisma.degreeRequirementSet.create({
        data: {
          name: 'Co-op Requirements',
          description: 'Co-op work term requirements',
          degreeId: pureMathCoopDegree.id,
        },
      });
      console.log('Created Co-op Requirements set');
    } else {
      console.log('Co-op Requirements set already exists');
    }

    // 5. Create Requirements
    // Work Term Requirement
    if (coopWorkTermRequirementSet) {
      let workTermRequirement = await prisma.degreeRequirement.findFirst({
        where: {
          name: 'Co-op Work Terms',
          requirementSetId: coopWorkTermRequirementSet.id,
        },
      });

      if (!workTermRequirement) {
        workTermRequirement = await prisma.degreeRequirement.create({
          data: {
            name: 'Co-op Work Terms',
            description: 'Complete at least 4 work terms as part of the co-op program',
            requirementSetId: coopWorkTermRequirementSet.id,
            type: 'CUSTOM',
          },
        });
        console.log('Created Co-op Work Terms requirement');
      } else {
        console.log('Co-op Work Terms requirement already exists');
      }
    }

    // Core PMATH Requirement
    if (coopCoreRequirementSet) {
      let coopCorePMATHRequirement = await prisma.degreeRequirement.findFirst({
        where: {
          name: 'Core Pure Mathematics Courses',
          requirementSetId: coopCoreRequirementSet.id,
        },
      });

      if (!coopCorePMATHRequirement) {
        coopCorePMATHRequirement = await prisma.degreeRequirement.create({
          data: {
            name: 'Core Pure Mathematics Courses',
            description: 'Complete all the following courses',
            requirementSetId: coopCoreRequirementSet.id,
            type: 'COURSE_LIST',
            coursesRequired: 5,
            unitsRequired: 2.5,
          },
        });
        console.log('Created Core Pure Mathematics Courses requirement for Co-op');
      } else {
        console.log('Core Pure Mathematics Courses requirement for Co-op already exists');
      }

      // Link core PMATH courses
      if (coopCorePMATHRequirement) {
        const corePMATHCourses = ['PMATH347', 'PMATH348', 'PMATH351', 'PMATH352', 'PMATH450'];
        for (const courseCode of corePMATHCourses) {
          const code = courseCode.substring(0, 5);
          const catalogNumber = courseCode.substring(5);
          
          const course = await prisma.course.findFirst({
            where: {
              courseCode: code,
              catalogNumber: catalogNumber,
            },
          });

          if (course) {
            // Check if this course is already linked
            const existingLink = await prisma.degreeRequirementCourse.findFirst({
              where: {
                requirementId: coopCorePMATHRequirement.id,
                courseId: course.id,
              },
            });

            if (!existingLink) {
              await prisma.degreeRequirementCourse.create({
                data: {
                  requirementId: coopCorePMATHRequirement.id,
                  courseId: course.id,
                  isRequired: true,
                },
              });
              console.log(`Linked ${courseCode} to Co-op core PMATH requirement`);
            } else {
              console.log(`Course ${courseCode} already linked to Co-op core PMATH requirement`);
            }
          } else {
            console.error(`Course ${courseCode} not found`);
          }
        }
      }
    }

    // Calculus 3 Requirement
    if (coopOptionalRequirementSet) {
      let coopCalculus3Requirement = await prisma.degreeRequirement.findFirst({
        where: {
          name: 'Calculus 3 Requirement',
          requirementSetId: coopOptionalRequirementSet.id,
        },
      });

      if (!coopCalculus3Requirement) {
        coopCalculus3Requirement = await prisma.degreeRequirement.create({
          data: {
            name: 'Calculus 3 Requirement',
            description: 'Complete 1 of the following courses',
            requirementSetId: coopOptionalRequirementSet.id,
            type: 'COURSE_LIST',
            coursesRequired: 1,
            unitsRequired: 0.5,
          },
        });
        console.log('Created Calculus 3 Requirement for Co-op');
      } else {
        console.log('Calculus 3 Requirement for Co-op already exists');
      }

      // Link Calculus 3 options
      if (coopCalculus3Requirement) {
        const calculus3Courses = ['MATH237', 'MATH247'];
        for (const courseCode of calculus3Courses) {
          const code = courseCode.substring(0, 4);
          const catalogNumber = courseCode.substring(4);
          
          const course = await prisma.course.findFirst({
            where: {
              courseCode: code,
              catalogNumber: catalogNumber,
            },
          });

          if (course) {
            // Check if this course is already linked
            const existingLink = await prisma.degreeRequirementCourse.findFirst({
              where: {
                requirementId: coopCalculus3Requirement.id,
                courseId: course.id,
              },
            });

            if (!existingLink) {
              await prisma.degreeRequirementCourse.create({
                data: {
                  requirementId: coopCalculus3Requirement.id,
                  courseId: course.id,
                  isRequired: false,
                },
              });
              console.log(`Linked ${courseCode} to Co-op Calculus 3 requirement`);
            } else {
              console.log(`Course ${courseCode} already linked to Co-op Calculus 3 requirement`);
            }
          } else {
            console.error(`Course ${courseCode} not found`);
          }
        }
      }
    }

    // Math Units and Non-Math Units Requirements
    if (coopGeneralRequirementSet) {
      let coopMathUnitsRequirement = await prisma.degreeRequirement.findFirst({
        where: {
          name: 'Math Units Requirement',
          requirementSetId: coopGeneralRequirementSet.id,
        },
      });

      if (!coopMathUnitsRequirement) {
        coopMathUnitsRequirement = await prisma.degreeRequirement.create({
          data: {
            name: 'Math Units Requirement',
            description: 'Complete a minimum of 13.0 units of math courses',
            requirementSetId: coopGeneralRequirementSet.id,
            type: 'UNITS',
            unitsRequired: 13.0,
            courseCodeRestriction: 'ACTSC, AMATH, CO, CS, MATBUS, MATH, PMATH, STAT',
          },
        });
        console.log('Created Math Units Requirement for Co-op');
      } else {
        console.log('Math Units Requirement for Co-op already exists');
      }

      let coopNonMathUnitsRequirement = await prisma.degreeRequirement.findFirst({
        where: {
          name: 'Non-Math Units Requirement',
          requirementSetId: coopGeneralRequirementSet.id,
        },
      });

      if (!coopNonMathUnitsRequirement) {
        coopNonMathUnitsRequirement = await prisma.degreeRequirement.create({
          data: {
            name: 'Non-Math Units Requirement',
            description: 'Complete a minimum of 5.0 units of non-math courses',
            requirementSetId: coopGeneralRequirementSet.id,
            type: 'UNITS',
            unitsRequired: 5.0,
          },
        });
        console.log('Created Non-Math Units Requirement for Co-op');
      } else {
        console.log('Non-Math Units Requirement for Co-op already exists');
      }
    }

    console.log('Pure Mathematics Co-op data added successfully!');
  } catch (error) {
    console.error('Error adding Pure Mathematics Co-op data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addPureMathCoopData();