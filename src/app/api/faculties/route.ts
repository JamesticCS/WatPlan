import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/faculties - Get all faculties (only those with programs)
export async function GET(request: NextRequest) {
  try {
    const faculties = await prisma.faculty.findMany({
      where: {
        programs: { some: {} },
      },
      include: {
        programs: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Sort by number of programs (descending) instead of alphabetical
    faculties.sort((a, b) => b.programs.length - a.programs.length);

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}
