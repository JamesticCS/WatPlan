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
    if (body.coopSequence) {
      updateData.coopSequence = body.coopSequence;
    }
    if (body.customTerms) {
      updateData.customTerms = body.customTerms;
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

// PATCH /api/plans/[id] - Partial update a plan
export async function PATCH(
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
    
    // Update fields that are present in the request
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.academicCalendarYear !== undefined) {
      updateData.academicCalendarYear = body.academicCalendarYear;
    }
    if (body.coopSequence !== undefined) {
      updateData.coopSequence = body.coopSequence;
    }
    if (body.customTerms !== undefined) {
      updateData.customTerms = body.customTerms;
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

// POST /api/plans/[id] - Duplicate a plan
export async function POST(
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
    const sourcePlan = await prisma.plan.findUnique({
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
          }
        },
      },
    });

    if (!sourcePlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name: requestedName } = body;
    
    // Check if the requested name already exists
    if (requestedName) {
      const existingPlan = await prisma.plan.findFirst({
        where: {
          userId: user.id,
          name: requestedName,
        },
      });
      
      if (existingPlan) {
        return NextResponse.json(
          { error: 'A plan with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Create the new plan
    const newPlan = await prisma.plan.create({
      data: {
        name: requestedName,
        userId: user.id,
        academicCalendarYear: sourcePlan.academicCalendarYear,
        coopSequence: sourcePlan.coopSequence,
        customTerms: sourcePlan.customTerms,
      },
    });

    // Copy degrees and their requirements
    for (const degree of sourcePlan.degrees) {
      const newPlanDegree = await prisma.planDegree.create({
        data: {
          planId: newPlan.id,
          degreeId: degree.degreeId,
          academicCalendarYear: degree.academicCalendarYear,
          programId: degree.programId,
          type: degree.type || 'MAJOR', // Default to MAJOR if type is missing
        },
      });
      
      // Safely copy requirements for this degree if they exist
      if (degree.requirements && degree.requirements.length > 0) {
        await prisma.planRequirement.createMany({
          data: degree.requirements.map(req => ({
            planDegreeId: newPlanDegree.id,
            requirementId: req.requirementId,
            status: req.status,
            progress: req.progress || 0, // Include progress field with default
          })),
        });
      }
    }

    // Copy courses
    if (sourcePlan.courses.length > 0) {
      await prisma.planCourse.createMany({
        data: sourcePlan.courses.map(course => ({
          planId: newPlan.id,
          courseId: course.courseId,
          term: course.term,
          termIndex: course.termIndex,
          status: course.status || 'PLANNED', // Provide default status if missing
          grade: course.grade,
          numericGrade: course.numericGrade
        })),
      });
    }
    
    // Fetch the complete new plan with all relationships to return
    const completePlan = await prisma.plan.findUnique({
      where: {
        id: newPlan.id,
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

    return NextResponse.json({ 
      success: true,
      plan: completePlan
    });
  } catch (error) {
    console.error('Error duplicating plan:', error);
    // Log more specific information about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to duplicate plan' },
      { status: 500 }
    );
  }
}