import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { ensureFacultyRequirements } from '@/lib/faculty-requirements';

// GET /api/plans/[id] - Get a specific plan by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        degrees: {
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
            requirementCache: {
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
              code: 'asc',
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

    // Backfill: ensure faculty requirements are present for existing plans
    let changed = false;
    try {
      changed = await ensureFacultyRequirements(prisma, id);
    } catch (error) {
      console.error('Error ensuring faculty requirements:', error);
    }

    if (!changed) {
      return NextResponse.json({ plan });
    }

    // Re-fetch only if faculty requirements were added/removed
    const freshPlan = await prisma.plan.findUnique({
      where: { id, userId },
      include: {
        degrees: {
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
            requirementCache: {
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
              code: 'asc',
            }
          }
        },
      },
    });

    return NextResponse.json({ plan: freshPlan });
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
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.academicCalendarYear) updateData.academicCalendarYear = body.academicCalendarYear;
    if (body.coopSequence) updateData.coopSequence = body.coopSequence;
    if (body.customTerms) updateData.customTerms = body.customTerms;

    const updatedPlan = await prisma.plan.update({
      where: { id },
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
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.academicCalendarYear !== undefined) updateData.academicCalendarYear = body.academicCalendarYear;
    if (body.coopSequence !== undefined) updateData.coopSequence = body.coopSequence;
    if (body.customTerms !== undefined) updateData.customTerms = body.customTerms;

    const updatedPlan = await prisma.plan.update({
      where: { id },
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
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (existingPlan.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the plan and all associated records
    await prisma.$transaction([
      prisma.planRequirementCache.deleteMany({
        where: {
          planDegree: {
            planId: id,
          },
        },
      }),
      prisma.planCourse.deleteMany({
        where: { planId: id },
      }),
      prisma.planDegree.deleteMany({
        where: { planId: id },
      }),
      prisma.plan.delete({
        where: { id },
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
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const sourcePlan = await prisma.plan.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        degrees: {
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
            requirementCache: {
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

    if (requestedName) {
      const existingPlan = await prisma.plan.findFirst({
        where: {
          userId,
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
        userId,
        academicCalendarYear: sourcePlan.academicCalendarYear,
        coopSequence: sourcePlan.coopSequence,
        customTerms: sourcePlan.customTerms ?? undefined,
      },
    });

    // Copy degrees and their requirement cache
    for (const degree of sourcePlan.degrees) {
      const newPlanDegree = await prisma.planDegree.create({
        data: {
          planId: newPlan.id,
          degreeId: degree.degreeId,
        },
      });

      if (degree.requirementCache && degree.requirementCache.length > 0) {
        await prisma.planRequirementCache.createMany({
          data: degree.requirementCache.map(cache => ({
            planDegreeId: newPlanDegree.id,
            requirementId: cache.requirementId,
            status: cache.status,
            progress: cache.progress,
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
          status: course.status || 'PLANNED',
          gradeLabel: course.gradeLabel,
          gradeNumeric: course.gradeNumeric,
          displayOrder: course.displayOrder,
        })),
      });
    }

    // Fetch the complete new plan
    const completePlan = await prisma.plan.findUnique({
      where: { id: newPlan.id },
      include: {
        degrees: {
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
            requirementCache: {
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
              code: 'asc',
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
