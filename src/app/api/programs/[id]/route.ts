import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadFullTree } from '@/lib/requirement-utils';

// GET /api/programs/[id] - Get a specific program by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        faculties: true,
        degrees: {
          include: {
            sections: {
              orderBy: { displayOrder: 'asc' },
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

    // Load full requirement trees for each section
    const degreesWithTrees = await Promise.all(
      program.degrees.map(async (degree) => {
        const sectionsWithTrees = await Promise.all(
          degree.sections.map(async (section) => {
            let requirementRoot = null;
            if (section.requirementRootId) {
              requirementRoot = await loadFullTree(prisma, section.requirementRootId);
            }
            return { ...section, requirementRoot };
          })
        );
        return { ...degree, sections: sectionsWithTrees };
      })
    );

    return NextResponse.json({
      program: { ...program, degrees: degreesWithTrees },
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}
