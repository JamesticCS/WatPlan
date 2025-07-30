import { PrismaClient } from '@prisma/client';
import { updateAllRequirementsForPlanDegree } from './requirement-utils';

// Known DEGREE_REQUIREMENTS degree IDs
const BMATH_DEGREE_REQ_ID = 'cmlwyc96f127mrogmp9pbozqc';
const BCS_DEGREE_REQ_ID = 'cmlwyc3kw125orogmn2uwpams';

const MATH_FACULTY_NAME = 'Faculty of Mathematics';
const SE_PROGRAM_NAME = 'Software Engineering';

/**
 * Given a degree (with its program and faculties), determine which
 * DEGREE_REQUIREMENTS degree should be auto-added, or null if none.
 */
function getDegreeRequirementsId(
  degree: { name: string; credentialCategory: string },
  program: { name: string; faculties?: Array<{ name: string }> }
): string | null {
  // Skip if already a DEGREE_REQUIREMENTS record
  if (degree.credentialCategory === 'DEGREE_REQUIREMENTS') return null;

  // Must be in the Math faculty
  const isMathFaculty = program.faculties?.some(f => f.name === MATH_FACULTY_NAME);
  if (!isMathFaculty) return null;

  // Exclude Software Engineering
  if (program.name === SE_PROGRAM_NAME) return null;

  // BCS programs get BCS degree requirements
  if (degree.name.includes('Bachelor of Computer Science')) {
    return BCS_DEGREE_REQ_ID;
  }

  // All other math faculty programs get BMath degree requirements
  return BMATH_DEGREE_REQ_ID;
}

/**
 * Ensure the plan has the correct DEGREE_REQUIREMENTS PlanDegrees based on
 * which programs are in the plan. Idempotent — safe to call multiple times.
 *
 * - Adds missing faculty requirement degrees
 * - Removes faculty requirement degrees that are no longer needed
 */
export async function ensureFacultyRequirements(
  prisma: PrismaClient,
  planId: string
): Promise<boolean> {
  // Load all plan degrees with program + faculty info
  const planDegrees = await prisma.planDegree.findMany({
    where: { planId },
    include: {
      degree: {
        include: {
          program: {
            include: { faculties: true },
          },
        },
      },
    },
  });

  // Compute which DEGREE_REQUIREMENTS IDs are needed
  const neededIds = new Set<string>();
  for (const pd of planDegrees) {
    const reqId = getDegreeRequirementsId(pd.degree, pd.degree.program);
    if (reqId) neededIds.add(reqId);
  }

  // Find which DEGREE_REQUIREMENTS PlanDegrees already exist
  const existingReqPlanDegrees = planDegrees.filter(
    pd => pd.degree.credentialCategory === 'DEGREE_REQUIREMENTS'
  );
  const existingIds = new Set(existingReqPlanDegrees.map(pd => pd.degreeId));

  let changed = false;

  // Add missing ones
  for (const reqId of neededIds) {
    if (!existingIds.has(reqId)) {
      const newPd = await prisma.planDegree.create({
        data: { planId, degreeId: reqId },
      });
      // Initialize requirement cache
      try {
        await updateAllRequirementsForPlanDegree(prisma, planId, newPd.id);
      } catch (error) {
        console.error('Error initializing faculty requirements cache:', error);
      }
      changed = true;
    }
  }

  // Remove ones no longer needed
  for (const pd of existingReqPlanDegrees) {
    if (!neededIds.has(pd.degreeId)) {
      await prisma.planRequirementCache.deleteMany({
        where: { planDegreeId: pd.id },
      });
      await prisma.planDegree.delete({
        where: { id: pd.id },
      });
      changed = true;
    }
  }

  return changed;
}
