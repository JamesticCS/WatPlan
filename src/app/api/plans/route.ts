import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

// GET /api/plans - Get current user's plans
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    // Get all plans for the current user
    const plans = await prisma.plan.findMany({
      where: {
        userId,
      },
      include: {
        degrees: {
          include: {
            degree: {
              include: {
                program: true,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST /api/plans - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    // Get request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }

    // Create a new plan
    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        userId,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
