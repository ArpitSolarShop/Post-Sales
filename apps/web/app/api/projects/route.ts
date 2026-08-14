import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { validateProjectBody, cleanString, parsePositiveNumber } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const search = cleanString(searchParams.get('search'), 200) || '';
    const division = cleanString(searchParams.get('division'), 20) || '';
    const stage = cleanString(searchParams.get('stage'), 30) || '';
    const brand = cleanString(searchParams.get('brand'), 100) || '';
    const poStatus = cleanString(searchParams.get('poStatus'), 20) || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const dateRange = searchParams.get('dateRange') || '';
    const timeStatus = searchParams.get('timeStatus') || '';

    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
          { caNumber: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    if (division) where.customer = { ...where.customer, division };
    if (stage) where.stage = stage;
    if (brand) where.brandModel = { contains: brand, mode: 'insensitive' };
    if (poStatus) where.poSigned = { contains: poStatus, mode: 'insensitive' };

    // Date Range Filters
    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: todayStart };
    } else if (dateRange === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: weekStart };
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      where.createdAt = { gte: monthStart };
    } else if (dateRange === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      where.createdAt = { gte: qStart };
    } else if (dateRange === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      where.createdAt = { gte: yearStart };
    } else if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z') }),
      };
    }

    // Time / Overdue Status Filters
    if (timeStatus === 'overdue') {
      where.stage = { notIn: ['CLOSED', 'SUBSIDY_REDEEMED'] };
      where.createdAt = { lte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) };
    } else if (timeStatus === 'dueSoon') {
      where.stage = { notIn: ['CLOSED', 'SUBSIDY_REDEEMED'] };
      where.createdAt = {
        gte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      };
    } else if (timeStatus === 'completed') {
      where.stage = { in: ['CLOSED', 'SUBSIDY_REDEEMED'] };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Projects list error:', error);
    return NextResponse.json(
      { error: 'Failed to load projects', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = validateProjectBody(body);

    if (validated.errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: validated.errors },
        { status: 400 }
      );
    }

    // Use transaction for atomicity
    const project = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: validated.customer as any,
      });

      const newProject = await tx.project.create({
        data: {
          customerId: customer.id,
          ...validated.project,
          stage: validated.project.stage as any,
        },
        include: { customer: true },
      });

      // Log creation with employee tracking
      await tx.activityLog.create({
        data: {
          projectId: newProject.id,
          employeeId: user!.id,
          action: 'CREATE',
          description: `New customer "${validated.customer.name}" created by ${user!.name}`,
          newState: {
            ...validated.customer,
            ...validated.project,
          },
        },
      });

      return newProject;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
