import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/plans/[id]/courses - Add a course to a plan
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

    // Check if plan exists and belongs to the user
    const plan = await prisma.plan.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: {
        id: body.courseId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is already in the plan
    const existingPlanCourse = await prisma.planCourse.findUnique({
      where: {
        planId_courseId: {
          planId: params.id,
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

    // Add course to plan
    const planCourse = await prisma.planCourse.create({
      data: {
        planId: params.id,
        courseId: body.courseId,
        term: body.term || null,
        status: (body.status as any) || 'PLANNED',
        grade: body.grade || null,
      },
      include: {
        course: true,
      },
    });

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

    // Check if plan exists and belongs to the user
    const plan = await prisma.plan.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    // Get all courses in the plan
    const planCourses = await prisma.planCourse.findMany({
      where: {
        planId: params.id,
      },
      include: {
        course: true,
      },
      orderBy: {
        course: {
          courseCode: 'asc',
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