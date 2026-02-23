import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// PUT /api/plans/[id]/requirements - Update all requirements for all degrees in a plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    await updateAllRequirementsForPlan(prisma, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating all plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to update plan requirements' },
      { status: 500 }
    );
  }
}
