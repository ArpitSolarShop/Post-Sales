import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const issue = await prisma.discomIssue.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.remark && { remark: body.remark }),
        ...(body.status === 'CLOSED' && { resolvedAt: new Date() }),
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}
