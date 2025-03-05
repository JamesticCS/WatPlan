import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/faculties - Get all faculties
export async function GET(request: NextRequest) {
  try {
    // Get all faculties
    const faculties = await prisma.faculty.findMany({
      include: {
        programs: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}