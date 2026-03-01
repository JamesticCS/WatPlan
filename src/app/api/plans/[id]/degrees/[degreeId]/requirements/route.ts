import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadFullTree, loadFullTrees, updateAllRequirementsForPlanDegree } from '@/lib/requirement-utils';

// GET /api/plans/[id]/degrees/[degreeId]/requirements - Get requirements for a plan degree
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; degreeId: string }> }
) {
  try {
    const { id, degreeId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planDegree = await prisma.planDegree.findUnique({
      where: {
        id: degreeId,
        planId: id,
      },
      include: {
        degree: {
          include: {
            sections: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!planDegree) {
      return NextResponse.json(
        { error: 'Plan degree not found' },
        { status: 404 }
      );
    }

    // Load requirement cache for this plan degree
    const cache = await prisma.planRequirementCache.findMany({
      where: { planDegreeId: degreeId },
    });
    const cacheMap = new Map(cache.map(c => [c.requirementId, c]));

    // Batch-load all section trees in a single query
    const rootIds = planDegree.degree.sections
      .filter(s => s.requirementRootId)
      .map(s => s.requirementRootId!);
    const treeMap = await loadFullTrees(prisma, rootIds);

    // Build sections with merged cache
    const sections = planDegree.degree.sections.map((section) => {
      let requirementRoot = null;

      if (section.requirementRootId) {
        requirementRoot = treeMap.get(section.requirementRootId) || null;

        if (requirementRoot) {
          mergeCache(requirementRoot, cacheMap);
        }
      }

      return {
        id: section.id,
        degreeId: section.degreeId,
        label: section.label,
        displayOrder: section.displayOrder,
        requirementRootId: section.requirementRootId,
        requirementRoot,
      };
    });

    // Filter out purely informational TEXT_RULE sections (leaf with no children),
    // but keep parent-constraint TEXT_RULEs whose label prefixes another section
    const filteredSections = sections.filter(s => {
      if (s.requirementRoot?.logicType !== 'TEXT_RULE') return true;
      if (s.requirementRoot.children?.length > 0) return true;
      // Keep if this section's label is a prefix of another section (parent constraint)
      const isParentConstraint = sections.some(
        other => other.id !== s.id && other.label.startsWith(s.label + ' - ')
      );
      return isParentConstraint;
    });

    return NextResponse.json({ sections: filteredSections });
  } catch (error) {
    console.error('Error fetching plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan requirements' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id]/degrees/[degreeId]/requirements - Update requirements for a plan degree
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; degreeId: string }> }
) {
  try {
    const { id, degreeId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planDegree = await prisma.planDegree.findUnique({
      where: {
        id: degreeId,
        planId: id,
      },
    });

    if (!planDegree) {
      return NextResponse.json(
        { error: 'Plan degree not found' },
        { status: 404 }
      );
    }

    // Re-evaluate all requirements
    await updateAllRequirementsForPlanDegree(prisma, id, degreeId);

    // Return updated sections (same as GET)
    const degree = await prisma.degree.findUnique({
      where: { id: planDegree.degreeId },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!degree) {
      return NextResponse.json(
        { error: 'Degree not found' },
        { status: 404 }
      );
    }

    const cache = await prisma.planRequirementCache.findMany({
      where: { planDegreeId: degreeId },
    });
    const cacheMap = new Map(cache.map(c => [c.requirementId, c]));

    // Batch-load all section trees in a single query
    const putRootIds = degree.sections
      .filter(s => s.requirementRootId)
      .map(s => s.requirementRootId!);
    const putTreeMap = await loadFullTrees(prisma, putRootIds);

    const sections = degree.sections.map((section) => {
      let requirementRoot = null;
      if (section.requirementRootId) {
        requirementRoot = putTreeMap.get(section.requirementRootId) || null;
        if (requirementRoot) {
          mergeCache(requirementRoot, cacheMap);
        }
      }
      return {
        id: section.id,
        degreeId: section.degreeId,
        label: section.label,
        displayOrder: section.displayOrder,
        requirementRootId: section.requirementRootId,
        requirementRoot,
      };
    });

    // Filter out purely informational TEXT_RULE sections (leaf with no children),
    // but keep parent-constraint TEXT_RULEs whose label prefixes another section
    const filteredSections = sections.filter(s => {
      if (s.requirementRoot?.logicType !== 'TEXT_RULE') return true;
      if (s.requirementRoot.children?.length > 0) return true;
      const isParentConstraint = sections.some(
        other => other.id !== s.id && other.label.startsWith(s.label + ' - ')
      );
      return isParentConstraint;
    });

    return NextResponse.json({ sections: filteredSections });
  } catch (error) {
    console.error('Error updating plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to update plan requirements' },
      { status: 500 }
    );
  }
}

// Helper to merge cache data into tree nodes
function mergeCache(
  node: any,
  cacheMap: Map<string, { status: string; progress: number; isManualOverride: boolean }>
) {
  const cached = cacheMap.get(node.id);
  if (cached) {
    node.status = cached.status;
    node.progress = cached.progress;
    node.isManualOverride = cached.isManualOverride;
  }
  if (node.children) {
    for (const child of node.children) {
      mergeCache(child, cacheMap);
    }
  }
}
