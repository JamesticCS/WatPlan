import { PrismaClient } from '@prisma/client';
import { updateAllRequirementsForPlanDegree } from './requirement-utils';

const MATH_FACULTY_NAME = 'Faculty of Mathematics';
const SE_PROGRAM_NAME = 'Software Engineering';

/**
 * Given a degree (with its program and faculties), determine which
 * DEGREE_REQUIREMENTS degree name pattern to search for, or null if none.
 */
function getDegreeRequirementsNamePattern(
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
    return 'Bachelor of Computer Science';
  }

  // All other math faculty programs get BMath degree requirements
  return 'Bachelor of Mathematics';
}

/** Cache looked-up degree requirement IDs to avoid repeated DB queries within a single call. */
const degreeReqCache = new Map<string, string | null>();

async function findDegreeRequirementsId(
  prisma: PrismaClient,
  namePattern: string
): Promise<string | null> {
  if (degreeReqCache.has(namePattern)) {
    return degreeReqCache.get(namePattern)!;
  }

  const degree = await prisma.degree.findFirst({
    where: {
      credentialCategory: 'DEGREE_REQUIREMENTS',
      name: { contains: namePattern },
    },
    select: { id: true },
  });

  const id = degree?.id ?? null;
  degreeReqCache.set(namePattern, id);
  return id;
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
    const namePattern = getDegreeRequirementsNamePattern(pd.degree, pd.degree.program);
    if (namePattern) {
      const reqId = await findDegreeRequirementsId(prisma, namePattern);
      if (reqId) neededIds.add(reqId);
    }
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
