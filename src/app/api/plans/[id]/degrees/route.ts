import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { updateAllRequirementsForPlanDegree } from '@/lib/requirement-utils';
import { ensureFacultyRequirements } from '@/lib/faculty-requirements';

// GET /api/plans/[id]/degrees - Get all degrees associated with a plan
export async function GET(
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

    const planDegrees = await prisma.planDegree.findMany({
      where: { planId: id },
      include: {
        degree: {
          include: {
            program: {
              include: {
                faculties: true,
              }
            }
          }
        },
      },
    });

    return NextResponse.json({ planDegrees });
  } catch (error) {
    console.error('Error fetching plan degrees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan degrees' },
      { status: 500 }
    );
  }
}

// POST /api/plans/[id]/degrees - Add a degree to a plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();

    if (!body.degreeId) {
      return NextResponse.json(
        { error: 'Degree ID is required' },
        { status: 400 }
      );
    }

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

    const degree = await prisma.degree.findUnique({
      where: { id: body.degreeId },
    });

    if (!degree) {
      return NextResponse.json(
        { error: 'Degree not found' },
        { status: 404 }
      );
    }

    // Check if this degree is already added to the plan
    const existingPlanDegree = await prisma.planDegree.findUnique({
      where: {
        planId_degreeId: {
          planId: id,
          degreeId: body.degreeId,
        },
      },
    });

    if (existingPlanDegree) {
      return NextResponse.json(
        { error: 'This degree is already added to the plan' },
        { status: 400 }
      );
    }

    // Add the degree to the plan
    const planDegree = await prisma.planDegree.create({
      data: {
        planId: id,
        degreeId: body.degreeId,
      },
      include: {
        degree: {
          include: {
            program: {
              include: {
                faculties: true,
              }
            }
          }
        },
      },
    });

    // Populate requirement cache based on current plan courses
    try {
      await updateAllRequirementsForPlanDegree(prisma, id, planDegree.id);
    } catch (error) {
      console.error('Error initializing requirements:', error);
    }

    // Auto-add faculty degree requirements if this is a math faculty program
    try {
      await ensureFacultyRequirements(prisma, id);
    } catch (error) {
      console.error('Error ensuring faculty requirements:', error);
    }

    return NextResponse.json({ planDegree });
  } catch (error) {
    console.error('Error adding degree to plan:', error);
    return NextResponse.json(
      { error: 'Failed to add degree to plan' },
      { status: 500 }
    );
  }
}
