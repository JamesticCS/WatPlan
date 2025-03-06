import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DegreeType } from '@/types';

// GET /api/plans/[id]/degrees - Get all degrees associated with a plan
export async function GET(
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

    // Get all degrees associated with the plan
    const planDegrees = await prisma.planDegree.findMany({
      where: {
        planId: params.id,
      },
      include: {
        degree: {
          include: {
            program: {
              include: {
                faculty: true,
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

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.degreeId) {
      return NextResponse.json(
        { error: 'Degree ID is required' },
        { status: 400 }
      );
    }

    if (!body.type || !Object.values(DegreeType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Valid degree type is required' },
        { status: 400 }
      );
    }

    // Find the plan and check if it belongs to the user
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

    // Check if the degree exists
    const degree = await prisma.degree.findUnique({
      where: {
        id: body.degreeId,
      },
    });

    if (!degree) {
      return NextResponse.json(
        { error: 'Degree not found' },
        { status: 404 }
      );
    }

    // Check if this degree is already added to the plan
    const existingPlanDegree = await prisma.planDegree.findFirst({
      where: {
        planId: params.id,
        degreeId: body.degreeId,
        type: body.type,
      },
    });

    if (existingPlanDegree) {
      return NextResponse.json(
        { error: 'This degree is already added to the plan with this type' },
        { status: 400 }
      );
    }

    // Add the degree to the plan
    const planDegree = await prisma.planDegree.create({
      data: {
        planId: params.id,
        degreeId: body.degreeId,
        type: body.type,
      },
      include: {
        degree: {
          include: {
            program: {
              include: {
                faculty: true,
              }
            },
            requirementSets: {
              include: {
                requirements: true
              }
            }
          }
        },
      },
    });

    // Create plan requirements for all requirements in this degree
    const requirementSets = planDegree.degree.requirementSets;
    if (requirementSets && requirementSets.length > 0) {
      const requirements = requirementSets.flatMap(set => set.requirements);
      
      // Create initial plan requirements with NOT_STARTED status
      await Promise.all(requirements.map(requirement => 
        prisma.planRequirement.create({
          data: {
            planDegreeId: planDegree.id,
            requirementId: requirement.id,
            status: 'NOT_STARTED',
            progress: 0
          }
        })
      ));

      // Update requirements based on current plan courses
      try {
        const { updateAllRequirementsForPlanDegree } = await import('@/lib/requirement-utils');
        await updateAllRequirementsForPlanDegree(prisma, params.id, planDegree.id);
      } catch (error) {
        console.error('Error initializing requirements:', error);
        // Continue even if requirements update fails
      }
    }

    // Re-fetch plan degree with requirements for response
    const updatedPlanDegree = await prisma.planDegree.findUnique({
      where: { id: planDegree.id },
      include: {
        degree: {
          include: {
            program: {
              include: {
                faculty: true,
              }
            }
          }
        },
      },
    });

    return NextResponse.json({ planDegree: updatedPlanDegree });
  } catch (error) {
    console.error('Error adding degree to plan:', error);
    return NextResponse.json(
      { error: 'Failed to add degree to plan' },
      { status: 500 }
    );
  }
}