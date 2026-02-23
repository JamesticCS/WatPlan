import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get the authenticated user from the session.
 * Returns the user object or a NextResponse error (401/404).
 */
export async function getAuthUser(): Promise<
  { user: { id: string; email: string }; error?: never } |
  { user?: never; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  return { user: { id: user.id, email: user.email! } };
}
