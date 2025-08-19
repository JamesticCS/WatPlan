import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/courses - Create a new course (used by transcript upload)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either the new field names or legacy names from transcript upload
    const subjectCode = (body.subjectCode || body.courseCode || '').toUpperCase();
    const courseNumber = body.number || body.catalogNumber || '';
    const courseName = body.name || body.title || '';
    const code = `${subjectCode}${courseNumber}`;

    if (!subjectCode || !courseNumber || !courseName) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectCode/courseCode, number/catalogNumber, name/title' },
        { status: 400 }
      );
    }

    // Check if course already exists by code
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      return NextResponse.json(existingCourse);
    }

    // Find or create subject
    let subject = await prisma.subject.findUnique({
      where: { code: subjectCode },
    });

    if (!subject) {
      // Create subject under "Unknown" faculty
      let unknownFaculty = await prisma.faculty.findFirst({
        where: { name: 'Unknown' },
      });
      if (!unknownFaculty) {
        unknownFaculty = await prisma.faculty.create({
          data: { name: 'Unknown' },
        });
      }
      subject = await prisma.subject.create({
        data: {
          code: subjectCode,
          name: subjectCode,
          facultyId: unknownFaculty.id,
        },
      });
    }

    // Create new course
    const newCourse = await prisma.course.create({
      data: {
        kualiId: `transcript-${code}`,
        code,
        number: courseNumber,
        subjectId: subject.id,
        name: courseName,
        description: body.description || `${subjectCode} ${courseNumber} course`,
        units: body.units || 0.5,
      },
    });

    return NextResponse.json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// GET /api/courses - Search courses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseCode = searchParams.get('courseCode');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build filter conditions
    let where = {};
    if (courseCode) {
      // Search by the combined code field (e.g., "CS341", "PMATH 333", "PMATH333")
      const normalized = courseCode.replace(/\s+/g, '').toUpperCase();
      where = {
        code: { contains: normalized, mode: 'insensitive' },
      };
    }

    const courses = await prisma.course.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        subjectRef: true,
      },
      orderBy: { code: 'asc' },
    });

    const total = await prisma.course.count({ where });

    return NextResponse.json({
      courses,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
