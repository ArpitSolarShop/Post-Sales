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
    const source = cleanString(searchParams.get('source'), 50) || '';
    const status = cleanString(searchParams.get('status'), 20) || '';
    const search = cleanString(searchParams.get('search'), 200) || '';

    const where: any = {};
    if (source) where.source = source;
    if (status) where.fileStatus = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const files = await prisma.netMeterFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const stats = await prisma.netMeterFile.groupBy({
      by: ['source', 'fileStatus'],
      _count: true,
    });

    return NextResponse.json({ data: files, stats });
  } catch (error) {
    console.error('Net meter files list error:', error);
    return NextResponse.json(
      { error: 'Failed to load net meter files', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
