import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlan } from '@/lib/requirement-utils';

// POST /api/plans/[id]/courses - Add course(s) to a plan
// Supports single course: { courseId, term?, status?, ... }
// Supports batch: { courses: [{ courseId, term?, status?, ... }, ...] }
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

    // Support batch: { courses: [...] } or single: { courseId: ... }
    const isBatch = Array.isArray(body.courses);
    const courseInputs: Array<{
      courseId: string;
      term?: string;
      status?: string;
      gradeLabel?: string;
      gradeNumeric?: number;
      displayOrder?: number;
    }> = isBatch ? body.courses : [body];

    if (courseInputs.length === 0 || !courseInputs[0].courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check which courses already exist in plan (batch lookup)
    const courseIds = courseInputs.map(c => c.courseId);
    const existing = await prisma.planCourse.findMany({
      where: { planId: id, courseId: { in: courseIds } },
      select: { courseId: true },
    });
    const existingSet = new Set(existing.map(e => e.courseId));

    // Filter to only new courses
    const newCourses = courseInputs.filter(c => !existingSet.has(c.courseId));
    const alreadyInPlan = courseInputs.length - newCourses.length;

    if (newCourses.length > 0) {
      // Batch create all new courses in one query
      await prisma.planCourse.createMany({
        data: newCourses.map(c => ({
          planId: id,
          courseId: c.courseId,
          term: c.term || 'BACKLOG',
          status: (c.status as any) || 'PLANNED',
          gradeLabel: c.gradeLabel || null,
          gradeNumeric: c.gradeNumeric != null ? c.gradeNumeric : null,
          displayOrder: c.displayOrder || 0,
        })),
      });

      // Update requirement cache in background (bulk SQL makes this fast)
      updateAllRequirementsForPlan(prisma, id).catch(error =>
        console.error('Error updating requirements after adding course:', error)
      );
    }

    // For single course backward compat, fetch and return the created course
    if (!isBatch) {
      if (existingSet.has(body.courseId)) {
        return NextResponse.json(
          { error: 'Course already in plan' },
          { status: 400 }
        );
      }
      const planCourse = await prisma.planCourse.findUnique({
        where: { planId_courseId: { planId: id, courseId: body.courseId } },
        include: { course: true },
      });
      return NextResponse.json({ planCourse }, { status: 201 });
    }

    // Batch response
    return NextResponse.json({
      added: newCourses.length,
      alreadyInPlan,
    }, { status: 201 });
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
