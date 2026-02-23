import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { computeWarningsForPlan } from '@/lib/warning-utils';

// GET /api/plans/[id]/warnings?termSequence=["1A","1B",...]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthUser();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const plan = await prisma.plan.findUnique({
      where: { id, userId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Parse term sequence from query params
    const termSequenceParam = request.nextUrl.searchParams.get('termSequence');
    if (!termSequenceParam) {
      return NextResponse.json({ error: 'termSequence query parameter is required' }, { status: 400 });
    }

    let termSequence: string[];
    try {
      termSequence = JSON.parse(termSequenceParam);
    } catch {
      return NextResponse.json({ error: 'Invalid termSequence format' }, { status: 400 });
    }

    const warnings = await computeWarningsForPlan(prisma, id, termSequence);

    return NextResponse.json({ warnings });
  } catch (error) {
    console.error('Error computing plan warnings:', error);
    return NextResponse.json(
      { error: 'Failed to compute warnings' },
      { status: 500 }
    );
  }
}
