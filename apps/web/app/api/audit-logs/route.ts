import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only ADMIN and MANAGER can view audit logs
  const [user, roleError] = await requireRole(['ADMIN', 'MANAGER']);
  if (roleError) return roleError;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'auth', 'data', 'all'
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')));

    let authLogs: any[] = [];
    let activityLogs: any[] = [];

    if (type === 'all' || type === 'auth') {
      authLogs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'all' || type === 'data') {
      activityLogs = await prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { name: true, email: true, role: true } },
          project: { select: { id: true, customer: { select: { name: true, caNumber: true } } } },
        },
      });
    }

    return NextResponse.json({
      authLogs,
      activityLogs,
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
