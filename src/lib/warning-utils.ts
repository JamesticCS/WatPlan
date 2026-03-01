import { PrismaClient } from '@prisma/client';
import { RequirementNode, PlanCourseForEval, EvalResult, evaluateNode, loadFullTrees } from './requirement-utils';

// ─── Types ─────────────────────────────────────────────────────────────────

export type WarningType = 'PREREQUISITE' | 'COREQUISITE' | 'ANTIREQUISITE';

export interface Warning {
  type: WarningType;
  message: string;
  details: string;
  dismissed: boolean;
}

export interface CourseWarning {
  courseId: string;
  courseCode: string;
  warnings: Warning[];
}

// ─── Batch Tree Loading ─────────────────────────────────────────────────────

/**
 * Load all prerequisite and corequisite trees for a set of courses in one query.
 */
async function loadAllRequisiteTrees(
  prisma: PrismaClient,
  courses: Array<{ courseId: string; prerequisiteRootId: string | null; corequisiteRootId: string | null }>
): Promise<{
  prereqTrees: Map<string, RequirementNode>;
  coreqTrees: Map<string, RequirementNode>;
}> {
  const rootToCoursePrereq = new Map<string, string>();
  const rootToCourseCoreq = new Map<string, string>();
  const rootIds: string[] = [];

  for (const c of courses) {
    if (c.prerequisiteRootId) {
      rootIds.push(c.prerequisiteRootId);
      rootToCoursePrereq.set(c.prerequisiteRootId, c.courseId);
    }
    if (c.corequisiteRootId) {
      rootIds.push(c.corequisiteRootId);
      rootToCourseCoreq.set(c.corequisiteRootId, c.courseId);
    }
  }

  const prereqTrees = new Map<string, RequirementNode>();
  const coreqTrees = new Map<string, RequirementNode>();

  if (rootIds.length === 0) return { prereqTrees, coreqTrees };

  // Use shared batch loader
  const allTrees = await loadFullTrees(prisma, rootIds);

  // Map root nodes to course IDs
  for (const [rootId, courseId] of rootToCoursePrereq) {
    const tree = allTrees.get(rootId);
    if (tree) prereqTrees.set(courseId, tree);
  }
  for (const [rootId, courseId] of rootToCourseCoreq) {
    const tree = allTrees.get(rootId);
    if (tree) coreqTrees.set(courseId, tree);
  }

  return { prereqTrees, coreqTrees };
}

// ─── Warning-specific Helpers ────────────────────────────────────────────────

/**
 * For warning evaluation, treat PLANNED/IN_PROGRESS courses as satisfying
 * requirements — the user intentionally placed them in the right order.
 * Only FAILED, DROPPED, BACKLOG remain unsatisfied.
 */
function asCompletedForWarnings(courses: PlanCourseForEval[]): PlanCourseForEval[] {
  return courses.map(c => ({
    ...c,
    status: (c.status === 'PLANNED' || c.status === 'IN_PROGRESS') ? 'COMPLETED' : c.status,
  }));
}

/**
 * Collect TEXT_RULE and UNITS node IDs in a tree and return manual overrides
 * that treat them as satisfied. We can't auto-verify these (e.g., "Level at
 * least 3A", "See corequisite"), so we skip them in warning evaluation.
 */
function collectNonCourseOverrides(node: RequirementNode): Map<string, EvalResult> {
  const overrides = new Map<string, EvalResult>();
  if (node.logicType === 'TEXT_RULE' || node.logicType === 'UNITS') {
    overrides.set(node.id, { status: 'COMPLETED', progress: 1 });
  }
  for (const child of node.children) {
    for (const [k, v] of collectNonCourseOverrides(child)) {
      overrides.set(k, v);
    }
  }
  return overrides;
}

// ─── Missing Course Details ─────────────────────────────────────────────────

/**
 * Walk a requirement tree and collect the course codes that are not satisfied.
 * Respects N_OF logic: if enough children are satisfied, the unsatisfied ones
 * are not listed (they're alternatives the user doesn't need).
 */
function collectUnsatisfiedCourses(
  node: RequirementNode,
  planCourses: PlanCourseForEval[],
  overrides: Map<string, EvalResult>
): string[] {
  // Skip TEXT_RULE/UNITS — we can't verify these, don't list them as missing
  if (node.logicType === 'TEXT_RULE' || node.logicType === 'UNITS') {
    return [];
  }

  if (node.logicType === 'COURSE') {
    const match = planCourses.find(pc => {
      if (node.courseId && pc.courseId === node.courseId) return true;
      if (node.courseCode && pc.courseCode === node.courseCode) return true;
      return false;
    });
    if (!match || match.status === 'FAILED' || match.status === 'DROPPED' || match.status === 'BACKLOG') {
      return [node.courseCode || 'Unknown'];
    }
    if (match.status === 'COMPLETED') {
      if (node.minGradeRequired != null && match.gradeNumeric != null && match.gradeNumeric < node.minGradeRequired) {
        return [`${node.courseCode || 'Unknown'} (need ${node.minGradeRequired}%, have ${match.gradeNumeric}%)`];
      }
      return [];
    }
    // PLANNED or IN_PROGRESS — not yet completed
    return [node.courseCode || 'Unknown'];
  }

  // For N_OF: if enough children are already satisfied, skip unsatisfied ones
  if (node.logicType === 'N_OF') {
    const n = node.n || 1;
    // Evaluate each child to see which are satisfied
    const childResults = node.children.map(child => ({
      child,
      result: overrides.get(child.id) ?? evaluateNode(child, planCourses, overrides),
    }));
    const satisfiedCount = childResults.filter(cr => cr.result.progress >= 1).length;
    if (satisfiedCount >= n) {
      return []; // Requirement met, no missing courses
    }
    // Only list missing courses from unsatisfied children
    const missing: string[] = [];
    for (const cr of childResults) {
      if (cr.result.progress < 1) {
        missing.push(...collectUnsatisfiedCourses(cr.child, planCourses, overrides));
      }
    }
    return missing;
  }

  // For ALL nodes, recurse all children
  const missing: string[] = [];
  for (const child of node.children) {
    missing.push(...collectUnsatisfiedCourses(child, planCourses, overrides));
  }
  return missing;
}

/**
 * Format a course code for display (e.g., "CS341" → "CS 341")
 */
function formatCode(code: string): string {
  const match = code.match(/^([A-Z]+)(\d.*)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return code;
}

// ─── Antirequisite Parsing ──────────────────────────────────────────────────

const COURSE_CODE_PATTERN = /[A-Z]{2,5}\s*\d{3}[A-Z]?/g;

function parseAntiRequisiteCodes(text: string): string[] {
  const matches = text.match(COURSE_CODE_PATTERN);
  if (!matches) return [];
  // Normalize: remove spaces between letters and numbers
  return [...new Set(matches.map(m => m.replace(/\s+/g, '')))];
}

// ─── Main Warning Computation ───────────────────────────────────────────────

export async function computeWarningsForPlan(
  prisma: PrismaClient,
  planId: string,
  termSequence: string[]
): Promise<CourseWarning[]> {
  // Load all plan courses with course data
  const planCourses = await prisma.planCourse.findMany({
    where: { planId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          number: true,
          subjectId: true,
          units: true,
          antiRequisiteText: true,
          crossListedWith: true,
          prerequisiteRootId: true,
          corequisiteRootId: true,
          subjectRef: { select: { code: true } },
        },
      },
    },
  });

  if (planCourses.length === 0) return [];

  // Build course data for evaluation
  const courseDataForEval: PlanCourseForEval[] = planCourses.map(pc => ({
    courseId: pc.courseId,
    courseCode: pc.course.code,
    subjectCode: pc.course.subjectRef?.code || pc.course.code.replace(/\d.*$/, ''),
    courseNumber: pc.course.number,
    status: pc.status,
    gradeNumeric: pc.gradeNumeric,
    units: pc.course.units,
  }));

  // All course codes in the plan (for antireq checking)
  const allPlanCourseCodes = new Set(planCourses.map(pc => pc.course.code));

  // Build term index map: term name → earliest index in sequence
  // Use the first occurrence so duplicate term names (e.g., multiple COOP) get the earliest index
  const termIndexMap = new Map<string, number>();
  termSequence.forEach((term, idx) => {
    if (!termIndexMap.has(term)) {
      termIndexMap.set(term, idx);
    }
  });

  // Batch load all prereq/coreq trees
  const { prereqTrees, coreqTrees } = await loadAllRequisiteTrees(
    prisma,
    planCourses.map(pc => ({
      courseId: pc.courseId,
      prerequisiteRootId: pc.course.prerequisiteRootId,
      corequisiteRootId: pc.course.corequisiteRootId,
    }))
  );

  const results: CourseWarning[] = [];

  for (const pc of planCourses) {
    const warnings: Warning[] = [];
    const termIndex = termIndexMap.get(pc.term);
    const isScheduled = termIndex !== undefined;
    const dismissedSet = new Set(pc.dismissedWarnings || []);

    // Skip prereq/coreq warnings for already-completed courses
    const skipRequisiteChecks = pc.status === 'COMPLETED';

    // ── Prerequisites ──
    if (!skipRequisiteChecks && isScheduled && prereqTrees.has(pc.courseId)) {
      const tree = prereqTrees.get(pc.courseId)!;
      // Filter to courses in strictly earlier terms, then treat PLANNED/IN_PROGRESS as satisfied
      const earlierCourses = asCompletedForWarnings(
        courseDataForEval.filter(c => {
          const cTermIndex = findTermIndex(c, planCourses, termIndexMap);
          return cTermIndex !== undefined && cTermIndex < termIndex;
        })
      );
      // Skip TEXT_RULE/UNITS nodes — we can't auto-verify them
      const overrides = collectNonCourseOverrides(tree);

      const result = evaluateNode(tree, earlierCourses, overrides);
      if (result.progress < 1) {
        const missing = collectUnsatisfiedCourses(tree, earlierCourses, overrides);
        // Only show warning if we can list specific missing courses
        if (missing.length > 0) {
          warnings.push({
            type: 'PREREQUISITE',
            message: 'Prerequisites not met',
            details: `Missing: ${missing.map(formatCode).join(', ')}`,
            dismissed: dismissedSet.has('PREREQUISITE'),
          });
        }
      }
    }

    // ── Corequisites ──
    if (!skipRequisiteChecks && isScheduled && coreqTrees.has(pc.courseId)) {
      const tree = coreqTrees.get(pc.courseId)!;
      // Filter to courses in same or earlier terms, then treat PLANNED/IN_PROGRESS as satisfied
      const sameOrEarlierCourses = asCompletedForWarnings(
        courseDataForEval.filter(c => {
          const cTermIndex = findTermIndex(c, planCourses, termIndexMap);
          return cTermIndex !== undefined && cTermIndex <= termIndex;
        })
      );
      // Skip TEXT_RULE/UNITS nodes
      const overrides = collectNonCourseOverrides(tree);

      const result = evaluateNode(tree, sameOrEarlierCourses, overrides);
      if (result.progress < 1) {
        const missing = collectUnsatisfiedCourses(tree, sameOrEarlierCourses, overrides);
        // Only show warning if we can list specific missing courses
        if (missing.length > 0) {
          warnings.push({
            type: 'COREQUISITE',
            message: 'Corequisites not met',
            details: `Missing: ${missing.map(formatCode).join(', ')}`,
            dismissed: dismissedSet.has('COREQUISITE'),
          });
        }
      }
    }

    // ── Antirequisites ──
    // "Not completed nor concurrently enrolled" — only flag if the antireq
    // course is in the same or an earlier term (already taken / concurrent).
    // Taking the antireq in a later term is fine.
    if (pc.course.antiRequisiteText) {
      const antiCodes = parseAntiRequisiteCodes(pc.course.antiRequisiteText);
      const crossListed = new Set(pc.course.crossListedWith || []);

      // Build set of course codes in same or earlier terms
      const sameOrEarlierCodes = new Set<string>();
      if (isScheduled) {
        for (const other of planCourses) {
          const otherIdx = termIndexMap.get(other.term);
          if (otherIdx !== undefined && otherIdx <= termIndex) {
            sameOrEarlierCodes.add(other.course.code);
          }
        }
      }

      const conflicts = antiCodes.filter(code =>
        code !== pc.course.code && !crossListed.has(code) && sameOrEarlierCodes.has(code)
      );

      if (conflicts.length > 0) {
        warnings.push({
          type: 'ANTIREQUISITE',
          message: 'Antirequisite conflict',
          details: `Conflicts with: ${conflicts.map(formatCode).join(', ')}`,
          dismissed: dismissedSet.has('ANTIREQUISITE'),
        });
      }
    }

    if (warnings.length > 0) {
      results.push({
        courseId: pc.courseId,
        courseCode: pc.course.code,
        warnings,
      });
    }
  }

  return results;
}

/**
 * Find the term index for a course in the plan.
 */
function findTermIndex(
  evalCourse: PlanCourseForEval,
  planCourses: Array<{ courseId: string; term: string }>,
  termIndexMap: Map<string, number>
): number | undefined {
  const pc = planCourses.find(p => p.courseId === evalCourse.courseId);
  if (!pc) return undefined;
  return termIndexMap.get(pc.term);
}
