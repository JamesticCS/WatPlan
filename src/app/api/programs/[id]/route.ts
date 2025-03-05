import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/programs/[id] - Get a specific program by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the program by ID with related data
    const program = await prisma.program.findUnique({
      where: {
        id: params.id,
      },
      include: {
        faculty: true,
        degrees: {
          include: {
            requirementSets: {
              include: {
                requirements: {
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
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}