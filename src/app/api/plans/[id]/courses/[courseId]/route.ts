import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// PUT /api/plans/[id]/courses/[courseId] - Update a course in a plan
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; courseId: string }> }
) {
  const { id, courseId } = await context.params;
  try {
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
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    const existingPlanCourse = await prisma.planCourse.findUnique({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
    });

    if (!existingPlanCourse) {
      return NextResponse.json(
        { error: 'Course not found in plan' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updatedPlanCourse = await prisma.planCourse.update({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
      data: {
        term: body.term !== undefined ? body.term : existingPlanCourse.term,
        status: body.status || existingPlanCourse.status,
        gradeLabel: body.gradeLabel !== undefined ? body.gradeLabel : existingPlanCourse.gradeLabel,
        gradeNumeric: body.gradeNumeric !== undefined ? body.gradeNumeric : existingPlanCourse.gradeNumeric,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existingPlanCourse.displayOrder,
        dismissedWarnings: body.dismissedWarnings !== undefined ? body.dismissedWarnings : existingPlanCourse.dismissedWarnings,
      },
      include: {
        course: true,
      },
    });

    // Fire-and-forget: update requirement cache in background
    updateAllRequirementsForPlan(prisma, id).catch(error =>
      console.error('Error updating requirements:', error)
    );

    return NextResponse.json({ planCourse: updatedPlanCourse });
  } catch (error) {
    console.error('Error updating plan course:', error);
    return NextResponse.json(
      { error: 'Failed to update plan course' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id]/courses/[courseId] - Remove a course from a plan
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; courseId: string }> }
) {
  const { id, courseId } = await context.params;
  try {
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
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    const existingPlanCourse = await prisma.planCourse.findUnique({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
    });

    if (!existingPlanCourse) {
      return NextResponse.json(
        { error: 'Course not found in plan' },
        { status: 404 }
      );
    }

    await prisma.planCourse.delete({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
    });

    // Fire-and-forget: update requirement cache in background
    updateAllRequirementsForPlan(prisma, id).catch(error =>
      console.error('Error updating requirements:', error)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing course from plan:', error);
    return NextResponse.json(
      { error: 'Failed to remove course from plan' },
      { status: 500 }
    );
  }
}
