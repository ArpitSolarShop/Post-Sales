import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cleanString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = cleanString(searchParams.get('status'), 20) || '';
    const search = cleanString(searchParams.get('search'), 200) || '';

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { issueDesc: { contains: search, mode: 'insensitive' } },
      ];
    }

    const issues = await prisma.discomIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Discom issues list error:', error);
    return NextResponse.json(
      { error: 'Failed to load issues', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();

    const customerName = cleanString(body.customerName, 200);
    if (!customerName) {
      return NextResponse.json(
        { error: 'Customer name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const issue = await prisma.discomIssue.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        customerName,
        caNumber: cleanString(body.caNumber, 30),
        division: cleanString(body.division, 20),
        mobile: cleanString(body.mobile, 20),
        issueDesc: cleanString(body.issueDesc, 1000),
        remark: cleanString(body.remark, 500),
        status: 'OPEN',
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Create discom issue error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
