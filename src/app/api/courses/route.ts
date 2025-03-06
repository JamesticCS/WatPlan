import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseCode = searchParams.get('courseCode');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build filter conditions
    let where = {};
    if (courseCode) {
      // Check if the query contains both code and number (e.g., "PMATH 333" or "PMATH333")
      const codeNumberMatch = courseCode.match(/^([A-Za-z]+)\s*(\d+)$/);
      
      if (codeNumberMatch) {
        // If there's a match, filter by both code and catalog number
        const [_, code, number] = codeNumberMatch;
        where = {
          AND: [
            { courseCode: { contains: code.toUpperCase() } },
            { catalogNumber: { contains: number } }
          ]
        };
      } else {
        // Otherwise, just filter by course code
        where = {
          OR: [
            { courseCode: { contains: courseCode.toUpperCase() } },
            { catalogNumber: { contains: courseCode } }
          ]
        };
      }
    }

    // Get courses with pagination
    const courses = await prisma.course.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { courseCode: 'asc' },
        { catalogNumber: 'asc' }
      ],
    });

    // Get total count for pagination
    const total = await prisma.course.count({
      where,
    });

    return NextResponse.json({
      courses,
      pagination: {
        total,
        limit,
        offset,
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}