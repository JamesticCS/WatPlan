import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// PUT /api/plans/[id]/courses/[courseId] - Update a course in a plan
export async function PUT(
  request: NextRequest,
  context: { params: { id: string; courseId: string } }
) {
  const { id, courseId } = await context.params;
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

    // Check if plan exists and belongs to the user
    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    // Check if the course is in the plan
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

    // Get request body
    const body = await request.json();
    
    // Update plan course
    const updatedPlanCourse = await prisma.planCourse.update({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
      data: {
        term: body.term !== undefined ? body.term : existingPlanCourse.term,
        termIndex: body.termIndex !== undefined ? body.termIndex : existingPlanCourse.termIndex,
        status: (body.status as any) || existingPlanCourse.status,
        grade: body.grade !== undefined ? body.grade : existingPlanCourse.grade,
      },
      include: {
        course: true,
      },
    });

    // Since the course status might have changed, update all plan requirements
    try {
      await updateAllRequirementsForPlan(prisma, id);
    } catch (error) {
      console.error('Error updating requirements after course update:', error);
      // Continue even if requirements update fails
    }

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
  context: { params: { id: string; courseId: string } }
) {
  const { id, courseId } = await context.params;
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

    // Check if plan exists and belongs to the user
    const plan = await prisma.plan.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    // Check if the course is in the plan
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

    // Remove course from plan
    await prisma.planCourse.delete({
      where: {
        planId_courseId: {
          planId: id,
          courseId,
        },
      },
    });

    // Since a course was removed, update all plan requirements
    try {
      await updateAllRequirementsForPlan(prisma, id);
    } catch (error) {
      console.error('Error updating requirements after course removal:', error);
      // Continue even if requirements update fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing course from plan:', error);
    return NextResponse.json(
      { error: 'Failed to remove course from plan' },
      { status: 500 }
    );
  }
}