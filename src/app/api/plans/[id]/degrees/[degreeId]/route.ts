import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE /api/plans/[id]/degrees/[degreeId] - Remove a degree from a plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; degreeId: string } }
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

    // Find the plan degree
    const planDegree = await prisma.planDegree.findUnique({
      where: {
        id: params.degreeId,
        planId: params.id,
      },
    });

    if (!planDegree) {
      return NextResponse.json(
        { error: 'Plan degree not found' },
        { status: 404 }
      );
    }

    // Delete any associated plan requirements
    await prisma.planRequirement.deleteMany({
      where: {
        planDegreeId: params.degreeId,
      },
    });

    // Delete the plan degree
    await prisma.planDegree.delete({
      where: {
        id: params.degreeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing degree from plan:', error);
    return NextResponse.json(
      { error: 'Failed to remove degree from plan' },
      { status: 500 }
    );
  }
}