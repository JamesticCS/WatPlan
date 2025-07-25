import { PrismaClient } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RequirementNode {
  id: string;
  parentId: string | null;
  logicType: 'ALL' | 'N_OF' | 'COURSE' | 'UNITS' | 'TEXT_RULE';
  label: string | null;
  n: number | null;
  courseId: string | null;
  courseCode: string | null;
  minGradeRequired: number | null;
  unitsRequired: number | null;
  subjectRestriction: string | null;
  levelRestriction: string | null;
  minAverage: number | null;
  maxFailures: number | null;
  failureRestriction: string | null;
  concentrationType: string | null;
  text: string | null;
  displayOrder: number;
  children: RequirementNode[];
}

export interface PlanCourseForEval {
  courseId: string;
  courseCode: string;    // e.g., "CS341"
  subjectCode: string;  // e.g., "CS"
  courseNumber: string;  // e.g., "341"
  status: string;
  gradeNumeric: number | null;
  units: number;
}

export interface EvalResult {
  status: 'NOT_STARTED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number; // 0.0 to 1.0
}

// ─── Tree Loading ──────────────────────────────────────────────────────────

const toNode = (r: any): RequirementNode => ({
  id: r.id,
  parentId: r.parentId ?? r.parentid ?? null,
  logicType: r.logicType ?? r.logictype,
  label: r.label,
  n: r.n,
  courseId: r.courseId ?? r.courseid ?? null,
  courseCode: r.courseCode ?? r.coursecode ?? null,
  minGradeRequired: r.minGradeRequired ?? r.mingraderequired ?? null,
  unitsRequired: r.unitsRequired != null ? Number(r.unitsRequired) : (r.unitsrequired != null ? Number(r.unitsrequired) : null),
  subjectRestriction: r.subjectRestriction ?? r.subjectrestriction ?? null,
  levelRestriction: r.levelRestriction ?? r.levelrestriction ?? null,
  minAverage: r.minAverage ?? r.minaverage ?? null,
  maxFailures: r.maxFailures ?? r.maxfailures ?? null,
  failureRestriction: r.failureRestriction ?? r.failurerestriction ?? null,
  concentrationType: r.concentrationType ?? r.concentrationtype ?? null,
  text: r.text,
  displayOrder: r.displayOrder ?? r.displayorder ?? 0,
  children: [],
});

/**
 * Load a full requirement tree from a root node using a single recursive CTE query.
 */
export async function loadFullTree(
  prisma: PrismaClient,
  rootId: string
): Promise<RequirementNode | null> {
  // Single recursive CTE to load the entire tree in one query
  const rows: any[] = await prisma.$queryRaw`
    WITH RECURSIVE tree AS (
      SELECT * FROM "Requirement" WHERE id = ${rootId}
      UNION ALL
      SELECT r.* FROM "Requirement" r
      INNER JOIN tree t ON r."parentId" = t.id
    )
    SELECT * FROM tree
  `;

  if (rows.length === 0) return null;

  // Build flat map
  const allNodes = new Map<string, RequirementNode>();
  for (const row of rows) {
    allNodes.set(row.id, toNode(row));
  }

  // Build tree structure
  for (const node of allNodes.values()) {
    if (node.parentId && allNodes.has(node.parentId)) {
      allNodes.get(node.parentId)!.children.push(node);
    }
  }

  // Sort children by displayOrder
  for (const node of allNodes.values()) {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return allNodes.get(rootId) || null;
}

// ─── Evaluation ────────────────────────────────────────────────────────────

/**
 * Evaluate a requirement node against a set of plan courses.
 * Returns status and progress (0.0 to 1.0).
 * manualOverrides: nodes that were manually marked by the user — used to
 * include TEXT_RULE/UNITS children in parent aggregation.
 */
export function evaluateNode(
  node: RequirementNode,
  planCourses: PlanCourseForEval[],
  manualOverrides: Map<string, EvalResult>
): EvalResult {
  switch (node.logicType) {
    case 'ALL':
      return evaluateAll(node, planCourses, manualOverrides);
    case 'N_OF':
      return evaluateNOf(node, planCourses, manualOverrides);
    case 'COURSE':
      return evaluateCourse(node, planCourses);
    case 'UNITS':
      // UNITS nodes can't be auto-evaluated accurately (restrictions not parsed)
      // They are manually checkable via the UI
      return { status: 'NOT_STARTED', progress: 0 };
    case 'TEXT_RULE':
      return { status: 'NOT_STARTED', progress: 0 };
  }
}

function deriveParentStatus(progress: number, childResults: EvalResult[]): EvalResult['status'] {
  if (progress >= 1) return 'COMPLETED';
  if (progress === 0) {
    // Check if any children are at least planned
    const hasPlanned = childResults.some(r => r.status === 'PLANNED');
    return hasPlanned ? 'PLANNED' : 'NOT_STARTED';
  }
  // progress > 0 but < 1 — check if any child is truly in progress or completed
  const hasInProgressOrCompleted = childResults.some(
    r => r.status === 'IN_PROGRESS' || r.status === 'COMPLETED'
  );
  return hasInProgressOrCompleted ? 'IN_PROGRESS' : 'PLANNED';
}

function evaluateAll(
  node: RequirementNode,
  planCourses: PlanCourseForEval[],
  manualOverrides: Map<string, EvalResult>
): EvalResult {
  const children = node.children;

  if (children.length === 0) {
    return { status: 'NOT_STARTED', progress: 0 };
  }

  const childResults: EvalResult[] = [];
  for (const child of children) {
    // Use manual override if available, otherwise evaluate
    const override = manualOverrides.get(child.id);
    childResults.push(override ?? evaluateNode(child, planCourses, manualOverrides));
  }

  // Average child progress so partial completion bubbles up
  const progress = childResults.reduce((sum, r) => sum + r.progress, 0) / children.length;
  return { status: deriveParentStatus(progress, childResults), progress };
}

function evaluateNOf(
  node: RequirementNode,
  planCourses: PlanCourseForEval[],
  manualOverrides: Map<string, EvalResult>
): EvalResult {
  const n = node.n || 1;
  const children = node.children;

  if (children.length === 0) {
    return { status: 'NOT_STARTED', progress: 0 };
  }

  const childResults: EvalResult[] = [];
  for (const child of children) {
    const override = manualOverrides.get(child.id);
    childResults.push(override ?? evaluateNode(child, planCourses, manualOverrides));
  }

  // Take the top N child progress values to reflect partial completion
  const sortedProgress = childResults.map(r => r.progress).sort((a, b) => b - a);
  const topN = sortedProgress.slice(0, n);
  const progress = topN.reduce((sum, p) => sum + p, 0) / n;
  return { status: deriveParentStatus(progress, childResults), progress };
}

function evaluateCourse(
  node: RequirementNode,
  planCourses: PlanCourseForEval[]
): EvalResult {
  // Find matching plan course by courseId or courseCode
  const match = planCourses.find(pc => {
    if (node.courseId && pc.courseId === node.courseId) return true;
    if (node.courseCode && pc.courseCode === node.courseCode) return true;
    return false;
  });

  if (!match) {
    return { status: 'NOT_STARTED', progress: 0 };
  }

  if (match.status === 'COMPLETED') {
    // Check minimum grade if required
    if (node.minGradeRequired != null && match.gradeNumeric != null) {
      if (match.gradeNumeric < node.minGradeRequired) {
        return { status: 'IN_PROGRESS', progress: 0 };
      }
    }
    return { status: 'COMPLETED', progress: 1 };
  }

  if (match.status === 'IN_PROGRESS') {
    return { status: 'IN_PROGRESS', progress: 0 };
  }

  if (match.status === 'PLANNED') {
    return { status: 'PLANNED', progress: 0 };
  }

  // FAILED, DROPPED, BACKLOG
  return { status: 'NOT_STARTED', progress: 0 };
}

// ─── Collect all node results for caching ──────────────────────────────────

/**
 * Recursively evaluate a tree and collect results for every node.
 * Manual overrides are respected: if a node has a manual override, its
 * cached value is used instead of re-evaluating.
 */
function collectNodeResults(
  node: RequirementNode,
  planCourses: PlanCourseForEval[],
  results: Map<string, EvalResult>,
  manualOverrides: Map<string, EvalResult>
): EvalResult {
  // Evaluate children first (depth-first)
  for (const child of node.children) {
    collectNodeResults(child, planCourses, results, manualOverrides);
  }

  // If this node has a manual override, use it instead of evaluating
  const override = manualOverrides.get(node.id);
  if (override) {
    results.set(node.id, override);
    return override;
  }

  const result = evaluateNode(node, planCourses, manualOverrides);
  results.set(node.id, result);
  return result;
}

// ─── Plan Course Preparation ───────────────────────────────────────────────

async function loadPlanCoursesForEval(
  prisma: PrismaClient,
  planId: string
): Promise<PlanCourseForEval[]> {
  const planCourses = await prisma.planCourse.findMany({
    where: { planId },
    include: {
      course: {
        include: {
          subjectRef: true,
        },
      },
    },
  });

  return planCourses.map(pc => ({
    courseId: pc.courseId,
    courseCode: pc.course.code,
    subjectCode: pc.course.subjectRef?.code || pc.course.code.replace(/\d.*$/, ''),
    courseNumber: pc.course.number,
    status: pc.status,
    gradeNumeric: pc.gradeNumeric,
    units: pc.course.units,
  }));
}

// ─── Manual Override Loading ──────────────────────────────────────────────

async function loadManualOverrides(
  prisma: PrismaClient,
  planDegreeId: string
): Promise<Map<string, EvalResult>> {
  const overrides = await prisma.planRequirementCache.findMany({
    where: { planDegreeId, isManualOverride: true },
  });

  const map = new Map<string, EvalResult>();
  for (const o of overrides) {
    map.set(o.requirementId, {
      status: o.status as EvalResult['status'],
      progress: o.progress,
    });
  }
  return map;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Update the requirement cache for a specific plan degree.
 * Loads the degree's sections, evaluates each requirement tree, and upserts results.
 * Manual overrides are preserved — they are not overwritten by re-evaluation.
 */
export async function updateAllRequirementsForPlanDegree(
  prisma: PrismaClient,
  planId: string,
  planDegreeId: string
): Promise<void> {
  // Load plan degree with its degree's sections
  const planDegree = await prisma.planDegree.findUnique({
    where: { id: planDegreeId },
    include: {
      degree: {
        include: {
          sections: true,
        },
      },
    },
  });

  if (!planDegree) return;

  // Load plan courses and manual overrides in parallel
  const [planCourses, manualOverrides] = await Promise.all([
    loadPlanCoursesForEval(prisma, planId),
    loadManualOverrides(prisma, planDegreeId),
  ]);

  // Load all section trees in parallel
  const sectionsWithRoots = planDegree.degree.sections.filter(s => s.requirementRootId);
  const trees = await Promise.all(
    sectionsWithRoots.map(s => loadFullTree(prisma, s.requirementRootId!))
  );

  // Evaluate all trees (respecting manual overrides)
  const allResults = new Map<string, EvalResult>();
  for (const tree of trees) {
    if (!tree) continue;
    collectNodeResults(tree, planCourses, allResults, manualOverrides);
  }

  // Batch upsert — skip manually-overridden entries
  const toUpsert = Array.from(allResults.entries()).filter(
    ([reqId]) => !manualOverrides.has(reqId)
  );

  if (toUpsert.length > 0) {
    await prisma.$transaction(
      toUpsert.map(([requirementId, result]) =>
        prisma.planRequirementCache.upsert({
          where: {
            planDegreeId_requirementId: {
              planDegreeId,
              requirementId,
            },
          },
          update: {
            status: result.status,
            progress: result.progress,
          },
          create: {
            planDegreeId,
            requirementId,
            status: result.status,
            progress: result.progress,
          },
        })
      )
    );
  }
}

/**
 * Update requirement cache for all degrees in a plan.
 * Shares planCourses across all degrees and processes them in parallel.
 */
export async function updateAllRequirementsForPlan(
  prisma: PrismaClient,
  planId: string
): Promise<void> {
  // Load plan degrees with their sections
  const planDegrees = await prisma.planDegree.findMany({
    where: { planId },
    include: {
      degree: {
        include: {
          sections: true,
        },
      },
    },
  });

  if (planDegrees.length === 0) return;

  // Load plan courses once, shared across all degrees
  const planCourses = await loadPlanCoursesForEval(prisma, planId);

  // Process all degrees in parallel
  await Promise.all(
    planDegrees.map(async (pd) => {
      // Load manual overrides for this degree
      const manualOverrides = await loadManualOverrides(prisma, pd.id);

      // Load all section trees in parallel
      const sectionsWithRoots = pd.degree.sections.filter(s => s.requirementRootId);
      const trees = await Promise.all(
        sectionsWithRoots.map(s => loadFullTree(prisma, s.requirementRootId!))
      );

      // Evaluate all trees (respecting manual overrides)
      const allResults = new Map<string, EvalResult>();
      for (const tree of trees) {
        if (!tree) continue;
        collectNodeResults(tree, planCourses, allResults, manualOverrides);
      }

      // Batch upsert — skip manually-overridden entries
      const toUpsert = Array.from(allResults.entries()).filter(
        ([reqId]) => !manualOverrides.has(reqId)
      );

      if (toUpsert.length > 0) {
        await prisma.$transaction(
          toUpsert.map(([requirementId, result]) =>
            prisma.planRequirementCache.upsert({
              where: {
                planDegreeId_requirementId: {
                  planDegreeId: pd.id,
                  requirementId,
                },
              },
              update: {
                status: result.status,
                progress: result.progress,
              },
              create: {
                planDegreeId: pd.id,
                requirementId,
                status: result.status,
                progress: result.progress,
              },
            })
          )
        );
      }
    })
  );
}
