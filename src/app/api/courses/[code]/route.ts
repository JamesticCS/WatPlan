import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadFullTree } from '@/lib/requirement-utils';

// GET /api/courses/[code] - Get a specific course by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: rawCode } = await params;
    const code = decodeURIComponent(rawCode);

    const course = await prisma.course.findUnique({
      where: { code },
      include: {
        subjectRef: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Load prerequisite and corequisite trees if they exist
    let prerequisiteRoot = null;
    let corequisiteRoot = null;

    if (course.prerequisiteRootId) {
      prerequisiteRoot = await loadFullTree(prisma, course.prerequisiteRootId);
    }
    if (course.corequisiteRootId) {
      corequisiteRoot = await loadFullTree(prisma, course.corequisiteRootId);
    }

    return NextResponse.json({
      course: {
        ...course,
        prerequisiteRoot,
        corequisiteRoot,
      },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
