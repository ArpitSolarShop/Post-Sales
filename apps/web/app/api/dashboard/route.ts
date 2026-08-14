import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateRange = searchParams.get('dateRange'); // 'today', 'week', 'month', 'quarter', 'year', 'all'

    let dateWhere: any = {};
    const now = new Date();

    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhere = { createdAt: { gte: todayStart } };
    } else if (dateRange === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateWhere = { createdAt: { gte: weekStart } };
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateWhere = { createdAt: { gte: monthStart } };
    } else if (dateRange === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      dateWhere = { createdAt: { gte: qStart } };
    } else if (dateRange === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateWhere = { createdAt: { gte: yearStart } };
    } else if (startDate || endDate) {
      dateWhere = {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z') }),
        },
      };
    }

    const [
      totalProjects,
      totalCustomers,
      openTasks,
      openDiscomIssues,
      revenueResult,
      balanceResult,
      stageBreakdown,
      recentActivity,
      brandBreakdown,
      overdueProjectsCount,
      completedCount,
    ] = await Promise.all([
      prisma.project.count({ where: dateWhere }),
      prisma.customer.count({ where: dateWhere.createdAt ? { createdAt: dateWhere.createdAt } : {} }),
      prisma.taskAssignment.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.discomIssue.count({ where: { status: 'OPEN' } }),
      prisma.project.aggregate({ where: dateWhere, _sum: { amount: true } }),
      prisma.project.aggregate({ where: dateWhere, _sum: { balance: true } }),
      prisma.project.groupBy({
        where: dateWhere,
        by: ['stage'],
        _count: { stage: true },
        orderBy: { _count: { stage: 'desc' } },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { name: true } } },
      }),
      prisma.project.groupBy({
        where: { ...dateWhere, brandModel: { not: null } },
        by: ['brandModel'],
        _count: { brandModel: true },
        orderBy: { _count: { brandModel: 'desc' } },
        take: 10,
      }),
      // Overdue: Projects in-progress for > 45 days
      prisma.project.count({
        where: {
          ...dateWhere,
          stage: { notIn: ['CLOSED', 'SUBSIDY_REDEEMED'] },
          createdAt: { lte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.project.count({
        where: {
          ...dateWhere,
          stage: { in: ['CLOSED', 'SUBSIDY_REDEEMED'] },
        },
      }),
    ]);

    const totalRevenue = revenueResult._sum.amount || 0;
    const totalBalance = balanceResult._sum.balance || 0;
    const totalCollected = totalRevenue - totalBalance;

    return NextResponse.json({
      totalProjects,
      totalCustomers,
      openTasks,
      openDiscomIssues,
      totalRevenue,
      totalBalance,
      totalCollected,
      overdueProjectsCount,
      completedCount,
      inProgressCount: totalProjects - completedCount,
      stageBreakdown: stageBreakdown.map((s) => ({
        stage: s.stage,
        count: s._count.stage,
      })),
      brandBreakdown: brandBreakdown.map((b) => ({
        brand: b.brandModel,
        count: b._count.brandModel,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
