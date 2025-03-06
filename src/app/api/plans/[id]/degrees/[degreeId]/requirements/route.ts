import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAllRequirementsForPlanDegree } from '@/lib/requirement-utils';

// GET /api/plans/[id]/degrees/[degreeId]/requirements - Get requirements for a plan degree
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; degreeId: string } }
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

    // Find the plan degree
    const planDegree = await prisma.planDegree.findUnique({
      where: {
        id: params.degreeId,
        planId: params.id,
      },
    });

    if (!planDegree) {
      return NextResponse.json(
        { error: 'Plan degree not found' },
        { status: 404 }
      );
    }

    // Get all requirements with their progress status and all related data
    const planRequirements = await prisma.planRequirement.findMany({
      where: {
        planDegreeId: params.degreeId,
      },
      include: {
        requirement: {
          include: {
            courses: {
              include: {
                course: true,
              },
            },
            substitutions: {
              include: {
                originalCourse: true,
                substituteCourse: true,
              },
            },
            lists: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response to match the Requirement type with all necessary details
    const requirements = planRequirements.map((pr) => ({
      id: pr.requirement.id,
      name: pr.requirement.name,
      description: pr.requirement.description,
      type: pr.requirement.type,
      unitsRequired: pr.requirement.unitsRequired,
      coursesRequired: pr.requirement.coursesRequired,
      levelRestriction: pr.requirement.levelRestriction,
      courseCodeRestriction: pr.requirement.courseCodeRestriction,
      concentrationType: pr.requirement.concentrationType,
      minCoursesPerSubject: pr.requirement.minCoursesPerSubject,
      status: pr.status,
      progress: pr.progress,
      // Include all courses associated with this requirement
      courses: pr.requirement.courses.map((rc) => rc.course),
      // Include substitutions
      substitutions: pr.requirement.substitutions.map((sub) => ({
        originalCourse: sub.originalCourse,
        substituteCourse: sub.substituteCourse
      })),
      // Include requirement lists (for MULTI_LIST type)
      lists: pr.requirement.lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        courses: list.courses.map((lc) => lc.course)
      }))
    }));

    return NextResponse.json({ requirements });
  } catch (error) {
    console.error('Error fetching plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan requirements' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id]/degrees/[degreeId]/requirements - Update all requirements for a plan degree
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; degreeId: string } }
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

    // Find the plan degree
    const planDegree = await prisma.planDegree.findUnique({
      where: {
        id: params.degreeId,
        planId: params.id,
      },
    });

    if (!planDegree) {
      return NextResponse.json(
        { error: 'Plan degree not found' },
        { status: 404 }
      );
    }

    // Update all requirements for this plan degree
    await updateAllRequirementsForPlanDegree(prisma, params.id, params.degreeId);

    // Fetch the updated requirements with all related data
    const planRequirements = await prisma.planRequirement.findMany({
      where: {
        planDegreeId: params.degreeId,
      },
      include: {
        requirement: {
          include: {
            courses: {
              include: {
                course: true,
              },
            },
            substitutions: {
              include: {
                originalCourse: true,
                substituteCourse: true,
              },
            },
            lists: {
              include: {
                courses: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response to match the Requirement type with all necessary details
    const requirements = planRequirements.map((pr) => ({
      id: pr.requirement.id,
      name: pr.requirement.name,
      description: pr.requirement.description,
      type: pr.requirement.type,
      unitsRequired: pr.requirement.unitsRequired,
      coursesRequired: pr.requirement.coursesRequired,
      levelRestriction: pr.requirement.levelRestriction,
      courseCodeRestriction: pr.requirement.courseCodeRestriction,
      concentrationType: pr.requirement.concentrationType,
      minCoursesPerSubject: pr.requirement.minCoursesPerSubject,
      status: pr.status,
      progress: pr.progress,
      // Include all courses associated with this requirement
      courses: pr.requirement.courses.map((rc) => rc.course),
      // Include substitutions
      substitutions: pr.requirement.substitutions.map((sub) => ({
        originalCourse: sub.originalCourse,
        substituteCourse: sub.substituteCourse
      })),
      // Include requirement lists (for MULTI_LIST type)
      lists: pr.requirement.lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        courses: list.courses.map((lc) => lc.course)
      }))
    }));

    return NextResponse.json({ requirements });
  } catch (error) {
    console.error('Error updating plan requirements:', error);
    return NextResponse.json(
      { error: 'Failed to update plan requirements' },
      { status: 500 }
    );
  }
}