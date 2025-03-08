import { PrismaClient, Course, DegreeRequirement, PlanCourse, DegreeRequirementCourse, CourseSubstitution, RequirementList } from '@prisma/client';
import { 
  calculateRequirementProgressPercentage, 
  determineRequirementStatus, 
  isCourseCompleted, 
  isCourseInProgress,
  courseExceedsMinimumGrade,
  calculateAverageGrade,
  countFailedCourses
} from './utils';
import { RequirementType } from '@/types';

// Calculate requirement progress based on plan courses
export async function calculateRequirementProgress(
  prisma: PrismaClient,
  planId: string,
  planDegreeId: string,
  requirementId: string
) {
  try {
    // Get the requirement details with all related data
    const requirement = await prisma.degreeRequirement.findUnique({
      where: { id: requirementId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
        substitutions: {
          include: {
            originalCourse: true,
            substituteCourse: true,
          },
        },
        lists: {
          include: {
            courses: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    // Get plan courses
    const planCourses = await prisma.planCourse.findMany({
      where: { planId },
      include: {
        course: true,
      },
    });

    // Calculate progress based on requirement type
    let progress = 0;
    let status = 'NOT_STARTED';

    console.log(`Calculating progress for requirement: ${requirement.name} (${requirement.id})`);
    console.log(`Requirement type: ${requirement.type}`);
    console.log(`Concentration type: ${requirement.concentrationType || 'none'}`);
    console.log(`Plan courses: ${planCourses.length}`);

    if (requirement.type === 'COURSE' || requirement.type === 'COURSE_LIST') {
      // For course or course list requirements
      const { completedCount, unitsCompleted } = countCompletedCourses(
        planCourses,
        requirement.courses,
        requirement.substitutions
      );
      
      console.log(`Completed count: ${completedCount}, Units completed: ${unitsCompleted}`);

      // Check for subject concentration requirements
      if (requirement.concentrationType === 'SINGLE_SUBJECT' && requirement.minCoursesPerSubject) {
        console.log(`Processing subject concentration requirement`);
        // Handle subject concentration logic
        const subjectProgress = calculateSubjectConcentrationProgress(
          planCourses,
          requirement.courseCodeRestriction,
          requirement.minCoursesPerSubject
        );
        
        progress = subjectProgress;
      } else {
        // Use either units or course count based on what's required
        if (requirement.unitsRequired) {
          progress = calculateRequirementProgressPercentage(
            requirement.type,
            requirement.unitsRequired,
            undefined,
            unitsCompleted,
            0
          );
          console.log(`Units-based progress: ${progress}%`);
        } else if (requirement.coursesRequired) {
          progress = calculateRequirementProgressPercentage(
            requirement.type,
            undefined,
            requirement.coursesRequired,
            0,
            completedCount
          );
          console.log(`Course-based progress: ${progress}%`);
        }
      }
    } else if (requirement.type === 'UNITS') {
      // For unit-based requirements with restrictions
      let validCourses = planCourses;

      // Filter by level restriction if specified
      if (requirement.levelRestriction) {
        validCourses = filterCoursesByLevel(validCourses, requirement.levelRestriction);
      }

      // Filter by course code restriction if specified
      if (requirement.courseCodeRestriction) {
        validCourses = filterCoursesByCode(validCourses, requirement.courseCodeRestriction);
      }

      // Calculate total units from valid courses
      const unitsCompleted = calculateCompletedUnits(validCourses);

      // Calculate progress if units are required
      if (requirement.unitsRequired) {
        progress = calculateRequirementProgressPercentage(
          requirement.type,
          requirement.unitsRequired,
          undefined,
          unitsCompleted,
          0
        );
      }
    } else if (requirement.type === 'MULTI_LIST') {
      // For multi-list requirements (e.g., complementary studies)
      // Calculate progress for each list and aggregate
      if (requirement.lists.length > 0) {
        // Create a map to keep track of which requirements we've satisfied
        const completedCoursesByList = new Map<string, PlanCourse[]>();
        
        // Initialize each list in our map
        requirement.lists.forEach(list => {
          completedCoursesByList.set(list.id, []);
        });
        
        // Check each plan course against each list's courses
        for (const planCourse of planCourses) {
          if (isCourseCompleted(planCourse.status)) {
            for (const list of requirement.lists) {
              const listCourseIds = list.courses.map(c => c.courseId);
              if (listCourseIds.includes(planCourse.courseId)) {
                const listCourses = completedCoursesByList.get(list.id) || [];
                listCourses.push(planCourse);
                completedCoursesByList.set(list.id, listCourses);
              }
            }
          }
        }
        
        // A list is completed if it has at least one completed course
        const listCompletionStatus = Array.from(completedCoursesByList.entries()).map(
          ([listId, courses]) => courses.length > 0
        );
        
        // Count how many lists have at least one completed course
        const completedListsCount = listCompletionStatus.filter(Boolean).length;
        
        // Calculate overall progress as a percentage of required lists
        if (requirement.coursesRequired) {
          progress = calculateRequirementProgressPercentage(
            'COURSE_LIST',
            undefined,
            requirement.coursesRequired,
            0,
            Math.min(completedListsCount, requirement.coursesRequired)
          );
        }
      }
    } else if (requirement.type === 'MIN_GRADE') {
      // Evaluate minimum grade requirements for specific courses
      if (requirement.courses && requirement.courses.length > 0 && requirement.minGradeRequired) {
        const requiredCourseIds = requirement.courses.map(c => c.courseId);
        const coursesInPlan = planCourses.filter(pc => requiredCourseIds.includes(pc.courseId));
        
        // Count how many courses meet the minimum grade requirement
        const satisfiedCourses = coursesInPlan.filter(pc => 
          courseExceedsMinimumGrade(pc, requirement.minGradeRequired || 0)
        ).length;
        
        // Calculate progress
        const totalRequiredCourses = requiredCourseIds.length;
        progress = totalRequiredCourses > 0 ? 
          Math.min(100, Math.round((satisfiedCourses / totalRequiredCourses) * 100)) : 0;
      }
    } else if (requirement.type === 'MIN_AVERAGE') {
      // Evaluate minimum average requirements
      if (requirement.minAverage) {
        // Filter courses if there are subject restrictions
        let relevantCourses = planCourses;
        
        if (requirement.courseCodeRestriction) {
          relevantCourses = filterCoursesByCode(relevantCourses, requirement.courseCodeRestriction);
        }
        
        if (requirement.levelRestriction) {
          relevantCourses = filterCoursesByLevel(relevantCourses, requirement.levelRestriction);
        }
        
        // Calculate the average
        const average = calculateAverageGrade(relevantCourses);
        
        // Calculate progress (100% if average meets requirement, 0% otherwise)
        // Or we could calculate proportionally: (average / minAverage) * 100
        progress = average >= requirement.minAverage ? 100 : 
          Math.min(100, Math.round((average / requirement.minAverage) * 100));
      }
    } else if (requirement.type === 'MAX_FAILURES') {
      // Evaluate maximum failure requirements
      if (requirement.maxFailures !== undefined) {
        // Count failures in the subject area if specified
        const failureCount = countFailedCourses(planCourses, requirement.failureRestriction);
        
        // Requirement is met if failures <= maxFailures
        progress = failureCount <= requirement.maxFailures ? 100 : 0;
      }
    } else if (requirement.type === 'CUSTOM') {
      // Handle custom requirement logic
      if (requirement.customLogicType) {
        switch (requirement.customLogicType) {
          case 'CONCURRENT_COURSES': {
            // Check if specified courses are taken in the same term
            // Parse the concurrent course IDs from the params
            const params = requirement.customLogicParams ? JSON.parse(requirement.customLogicParams) : {};
            const concurrentCourseIds = params.courseIds || [];
            
            if (concurrentCourseIds.length >= 2) {
              // Group plan courses by term
              const coursesByTerm = new Map<string, string[]>();
              
              for (const pc of planCourses) {
                if (pc.term && concurrentCourseIds.includes(pc.courseId)) {
                  if (!coursesByTerm.has(pc.term)) {
                    coursesByTerm.set(pc.term, []);
                  }
                  coursesByTerm.get(pc.term)?.push(pc.courseId);
                }
              }
              
              // Check if any term has all the required courses
              let concurrent = false;
              for (const [term, courses] of coursesByTerm.entries()) {
                if (courses.length === concurrentCourseIds.length) {
                  concurrent = true;
                  break;
                }
              }
              
              progress = concurrent ? 100 : 0;
            }
            break;
          }
          default:
            console.log(`Unknown custom logic type: ${requirement.customLogicType}`);
            progress = 0;
        }
      }
    }

    // Determine status from progress
    status = determineRequirementStatus(progress);

    // Update the plan requirement in the database
    await prisma.planRequirement.upsert({
      where: {
        planDegreeId_requirementId: {
          planDegreeId,
          requirementId,
        },
      },
      update: {
        status,
        progress,
      },
      create: {
        planDegreeId,
        requirementId,
        status,
        progress,
      },
    });

    return { status, progress };
  } catch (error) {
    console.error('Error calculating requirement progress:', error);
    throw error;
  }
}

// Count completed courses that satisfy a requirement
function countCompletedCourses(
  planCourses: (PlanCourse & { course: Course })[],
  requirementCourses: (DegreeRequirementCourse & { course: Course })[],
  substitutions: (CourseSubstitution & { 
    originalCourse: Course;
    substituteCourse: Course;
  })[] = []
) {
  let completedCount = 0;
  let unitsCompleted = 0;

  const requiredCourseIds = requirementCourses.map((rc) => rc.courseId);

  // Build a map of valid substitutions
  const substitutionMap = new Map<string, string[]>();
  for (const sub of substitutions) {
    const originalId = sub.originalCourseId;
    const substituteId = sub.substituteCourseId;
    
    if (!substitutionMap.has(originalId)) {
      substitutionMap.set(originalId, []);
    }
    substitutionMap.get(originalId)?.push(substituteId);
  }

  for (const planCourse of planCourses) {
    let isValidCourse = false;
    
    // Check if this course is directly part of the requirement
    if (requiredCourseIds.includes(planCourse.courseId)) {
      isValidCourse = true;
    } 
    // Check if this course is a valid substitute for a required course
    else {
      for (const [originalId, substituteIds] of substitutionMap.entries()) {
        if (substituteIds.includes(planCourse.courseId) && requiredCourseIds.includes(originalId)) {
          isValidCourse = true;
          break;
        }
      }
    }

    if (isValidCourse) {
      // For completed courses
      if (isCourseCompleted(planCourse.status)) {
        completedCount++;
        unitsCompleted += planCourse.course.units;
      }
      // For in-progress courses (optional: might count these as partial progress)
      else if (isCourseInProgress(planCourse.status)) {
        // Could count as partial completion if desired
      }
    }
  }

  return { completedCount, unitsCompleted };
}

// Calculate progress for subject concentration requirements
function calculateSubjectConcentrationProgress(
  planCourses: (PlanCourse & { course: Course })[],
  courseCodeRestriction: string | null | undefined,
  minCoursesPerSubject: number
): number {
  // If no restriction specified, return 0
  if (!courseCodeRestriction) return 0;

  // Parse allowed subject codes
  const allowedCodes = courseCodeRestriction.split(',').map(code => code.trim());
  
  // Log for debugging
  console.log(`Subject concentration: allowed codes = ${allowedCodes.join(', ')}`);
  console.log(`Subject concentration: minCoursesPerSubject = ${minCoursesPerSubject}`);
  
  // Group completed courses by subject code
  const completedCoursesBySubject = new Map<string, (PlanCourse & { course: Course })[]>();
  
  for (const subject of allowedCodes) {
    completedCoursesBySubject.set(subject, []);
  }
  
  // Log all plan courses
  console.log(`Subject concentration: checking ${planCourses.length} plan courses`);
  for (const planCourse of planCourses) {
    console.log(`Course: ${planCourse.course.courseCode} ${planCourse.course.catalogNumber}, status: ${planCourse.status}`);
  }
  
  // Add completed courses to their respective subjects
  for (const planCourse of planCourses) {
    const subjectCode = planCourse.course.courseCode;
    if (allowedCodes.includes(subjectCode) && isCourseCompleted(planCourse.status)) {
      const courses = completedCoursesBySubject.get(subjectCode) || [];
      courses.push(planCourse);
      completedCoursesBySubject.set(subjectCode, courses);
      console.log(`Added ${subjectCode} ${planCourse.course.catalogNumber} to subject concentration group`);
    }
  }
  
  // Log subjects and their course counts
  for (const [subject, courses] of completedCoursesBySubject.entries()) {
    console.log(`Subject ${subject}: ${courses.length} completed courses`);
  }
  
  // Find the subject with the most completed courses that meets the minimum requirement
  // Subject concentration requires ALL courses to be from the same subject
  let bestSubjectProgress = 0;
  
  for (const [subject, courses] of completedCoursesBySubject.entries()) {
    const subjectProgress = calculateRequirementProgressPercentage(
      'COURSE_LIST',
      undefined,
      minCoursesPerSubject,
      0,
      courses.length
    );
    
    console.log(`Subject ${subject}: progress = ${subjectProgress}%`);
    
    if (subjectProgress > bestSubjectProgress) {
      bestSubjectProgress = subjectProgress;
    }
  }
  
  console.log(`Subject concentration: best progress = ${bestSubjectProgress}%`);
  return bestSubjectProgress;
}

// Filter courses by level (e.g., "300-400" for 300 or 400 level courses)
function filterCoursesByLevel(
  courses: (PlanCourse & { course: Course })[],
  levelRestriction: string
) {
  // Parse the level restriction (e.g., "300-400" → min=300, max=400)
  const [minLevel, maxLevel] = levelRestriction.split('-').map(Number);

  return courses.filter((planCourse) => {
    // Extract the numeric part of the catalog number
    // This handles cases like "210F" by extracting just the numeric prefix
    const catalogNumber = planCourse.course.catalogNumber;
    const numericMatch = /^(\d+)/.exec(catalogNumber);
    
    if (!numericMatch) return false;
    
    const courseNumber = parseInt(numericMatch[1], 10);
    if (isNaN(courseNumber)) return false;

    // Calculate the course level (e.g., 347 => 300 level)
    const courseLevel = Math.floor(courseNumber / 100) * 100;
    
    // Check if the course level is within the specified range
    return (
      courseLevel >= minLevel && (maxLevel ? courseLevel <= maxLevel : true)
    );
  });
}

// Filter courses by course code (e.g., "MATH, CS" for only MATH or CS courses)
function filterCoursesByCode(
  courses: (PlanCourse & { course: Course })[],
  codeRestriction: string
) {
  const allowedCodes = codeRestriction.split(',').map((code) => code.trim());

  return courses.filter((planCourse) =>
    allowedCodes.includes(planCourse.course.courseCode)
  );
}

// Calculate total units from completed courses
function calculateCompletedUnits(courses: (PlanCourse & { course: Course })[]) {
  return courses
    .filter((planCourse) => isCourseCompleted(planCourse.status))
    .reduce((total, planCourse) => total + planCourse.course.units, 0);
}

// Update all requirements for a plan degree
export async function updateAllRequirementsForPlanDegree(
  prisma: PrismaClient,
  planId: string,
  planDegreeId: string
) {
  try {
    // Get plan to determine academic calendar year
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Get all requirements for this plan degree by getting the degree and its requirements
    const planDegree = await prisma.planDegree.findUnique({
      where: { id: planDegreeId },
      include: {
        degree: {
          include: {
            requirementSets: {
              where: {
                // Filter by academic calendar year if it exists, otherwise include all
                OR: [
                  { academicCalendarYear: plan.academicCalendarYear },
                  { academicCalendarYear: null }
                ]
              },
              include: {
                requirements: true,
              },
            },
          },
        },
      },
    });

    if (!planDegree) {
      throw new Error('Plan degree not found');
    }

    // Flatten requirements from filtered requirement sets
    const requirements = planDegree.degree.requirementSets.flatMap(
      (set) => set.requirements
    );

    // First, clear existing plan requirements for this plan degree
    await prisma.planRequirement.deleteMany({
      where: { planDegreeId }
    });

    // Update progress for each requirement
    const results = await Promise.all(
      requirements.map((requirement) =>
        calculateRequirementProgress(prisma, planId, planDegreeId, requirement.id)
      )
    );

    return results;
  } catch (error) {
    console.error('Error updating all requirements for plan degree:', error);
    throw error;
  }
}

// Update all requirements for all degrees in a plan
export async function updateAllRequirementsForPlan(
  prisma: PrismaClient,
  planId: string
) {
  try {
    // Get all degrees for this plan
    const planDegrees = await prisma.planDegree.findMany({
      where: { planId },
    });

    // Update requirements for each plan degree
    const results = await Promise.all(
      planDegrees.map((planDegree) =>
        updateAllRequirementsForPlanDegree(prisma, planId, planDegree.id)
      )
    );

    return results;
  } catch (error) {
    console.error('Error updating all requirements for plan:', error);
    throw error;
  }
}