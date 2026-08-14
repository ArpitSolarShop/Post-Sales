import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { cleanString, cleanPhone } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        schedule: true,
        _count: {
          select: { assignedTasks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Employees list error:', error);
    return NextResponse.json(
      { error: 'Failed to load employees', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only Admin or Manager can create employees
  const [currentUser, roleError] = await requireRole(['ADMIN', 'MANAGER']);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const name = cleanString(body.name, 100);
    const email = cleanString(body.email, 100);
    const password = body.password ? String(body.password) : '';
    const phone = cleanPhone(body.phone);
    const role = cleanString(body.role, 30) || 'TECHNICIAN';
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.employee.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Employee with this email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role as any,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userEmail: currentUser!.email,
        userName: currentUser!.name,
        role: currentUser!.role,
        action: 'CREATE_EMPLOYEE',
        details: `Created team member ${name} (${email}) with role ${role}`,
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
