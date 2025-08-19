import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/programs - Get all programs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = searchParams.get('facultyId');
    const name = searchParams.get('name');

    const where: any = {};

    if (facultyId) {
      where.faculties = { some: { id: facultyId } };
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        faculties: true,
        degrees: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
