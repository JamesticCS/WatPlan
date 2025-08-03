import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureFacultyRequirements } from '@/lib/faculty-requirements';

// DELETE /api/plans/[id]/degrees/[degreeId] - Remove a degree from a plan
export async function DELETE(
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

    // Delete associated requirement cache entries
    await prisma.planRequirementCache.deleteMany({
      where: { planDegreeId: degreeId },
    });

    // Delete the plan degree
    await prisma.planDegree.delete({
      where: { id: degreeId },
    });

    // Clean up faculty requirements if no longer needed
    try {
      await ensureFacultyRequirements(prisma, id);
    } catch (error) {
      console.error('Error cleaning up faculty requirements:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing degree from plan:', error);
    return NextResponse.json(
      { error: 'Failed to remove degree from plan' },
      { status: 500 }
    );
  }
}
