import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// POST /api/plans/[id]/courses - Add a course to a plan
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
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
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (!body.courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const existingPlanCourse = await prisma.planCourse.findUnique({
      where: {
        planId_courseId: {
          planId: id,
          courseId: body.courseId,
        },
      },
    });

    if (existingPlanCourse) {
      return NextResponse.json(
        { error: 'Course already in plan' },
        { status: 400 }
      );
    }

    const planCourse = await prisma.planCourse.create({
      data: {
        planId: id,
        courseId: body.courseId,
        term: body.term || 'BACKLOG',
        status: (body.status as any) || 'PLANNED',
        gradeLabel: body.gradeLabel || null,
        gradeNumeric: body.gradeNumeric != null ? body.gradeNumeric : null,
        displayOrder: body.displayOrder || 0,
      },
      include: {
        course: true,
      },
    });

    // Fire-and-forget: update requirement cache in background
    updateAllRequirementsForPlan(prisma, id).catch(error =>
      console.error('Error updating requirements after adding course:', error)
    );

    return NextResponse.json({ planCourse }, { status: 201 });
  } catch (error) {
    console.error('Error adding course to plan:', error);
    return NextResponse.json(
      { error: 'Failed to add course to plan' },
      { status: 500 }
    );
  }
}

// GET /api/plans/[id]/courses - Get all courses in a plan
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
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
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    const planCourses = await prisma.planCourse.findMany({
      where: { planId: id },
      include: {
        course: true,
      },
      orderBy: {
        course: {
          code: 'asc',
        },
      },
    });

    return NextResponse.json({ planCourses });
  } catch (error) {
    console.error('Error fetching plan courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan courses' },
      { status: 500 }
    );
  }
}
