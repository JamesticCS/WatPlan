import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// PUT /api/plans/[id]/requirements - Update all requirements for all degrees in a plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the plan by ID, ensuring it belongs to the current user
    const plan = await prisma.plan.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Update all requirements for all degrees in this plan
    await updateAllRequirementsForPlan(prisma, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating all plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to update plan requirements' },
      { status: 500 }
    );
  }
}