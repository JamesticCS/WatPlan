import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/plans/[id] - Get a specific plan by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  
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
        id,
        userId: user.id,
      },
      include: {
        degrees: {
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
            requirements: {
              include: {
                requirement: true,
              }
            }
          }
        },
        courses: {
          include: {
            course: true,
          },
          orderBy: {
            course: {
              courseCode: 'asc',
            }
          }
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id] - Update a plan
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  
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
    
    // Find the plan and check if it belongs to the user
    const existingPlan = await prisma.plan.findUnique({
      where: {
        id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name) {
      updateData.name = body.name;
    }
    if (body.academicCalendarYear) {
      updateData.academicCalendarYear = body.academicCalendarYear;
    }

    // Update the plan
    const updatedPlan = await prisma.plan.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Delete a plan
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  
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

    // Find the plan and check if it belongs to the user
    const existingPlan = await prisma.plan.findUnique({
      where: {
        id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the plan and all associated records
    await prisma.$transaction([
      prisma.planRequirement.deleteMany({
        where: {
          planDegree: {
            planId: id,
          },
        },
      }),
      prisma.planCourse.deleteMany({
        where: {
          planId: id,
        },
      }),
      prisma.planDegree.deleteMany({
        where: {
          planId: id,
        },
      }),
      prisma.plan.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}