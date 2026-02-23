import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlanDegree } from '@/lib/requirement-utils';

// PATCH /api/plans/[id]/degrees/[degreeId]/requirements/[requirementId] - Toggle manual override
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; degreeId: string; requirementId: string }> }
) {
  try {
    const { id, degreeId, requirementId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify plan ownership
    const plan = await prisma.plan.findUnique({
      where: { id, userId: user.id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verify plan degree exists
    const planDegree = await prisma.planDegree.findUnique({
      where: { id: degreeId, planId: id },
    });

    if (!planDegree) {
      return NextResponse.json({ error: 'Plan degree not found' }, { status: 404 });
    }

    const body = await request.json();
    const { isCompleted } = body;

    // Upsert the manual override
    await prisma.planRequirementCache.upsert({
      where: {
        planDegreeId_requirementId: { planDegreeId: degreeId, requirementId },
      },
      update: {
        status: isCompleted ? 'COMPLETED' : 'NOT_STARTED',
        progress: isCompleted ? 1 : 0,
        isManualOverride: true,
      },
      create: {
        planDegreeId: degreeId,
        requirementId,
        status: isCompleted ? 'COMPLETED' : 'NOT_STARTED',
        progress: isCompleted ? 1 : 0,
        isManualOverride: true,
      },
    });

    // Re-evaluate to update parent progress (respects manual overrides)
    await updateAllRequirementsForPlanDegree(prisma, id, degreeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling requirement override:', error);
    return NextResponse.json(
      { error: 'Failed to toggle requirement' },
      { status: 500 }
    );
  }
}
