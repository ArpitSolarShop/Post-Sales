import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { cleanString, cleanPhone } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only Admin or Manager can modify employees
  const [currentUser, roleError] = await requireRole(['ADMIN', 'MANAGER']);
  if (roleError) return roleError;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const name = body.name !== undefined ? cleanString(body.name, 100) : undefined;
    const email = body.email !== undefined ? cleanString(body.email, 100) : undefined;
    const phone = body.phone !== undefined ? cleanPhone(body.phone) : undefined;
    const role = body.role !== undefined ? cleanString(body.role, 30) : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : undefined;
    const password = body.password ? String(body.password) : undefined;

    // Prevent active user from deactivating themselves or changing their own role
    if (id === currentUser!.id) {
      if (isActive === false) {
        return NextResponse.json(
          { error: 'You cannot deactivate your own account', code: 'SELF_DEACTIVATION' },
          { status: 400 }
        );
      }
      if (role && role !== currentUser!.role) {
        return NextResponse.json(
          { error: 'You cannot change your own role', code: 'SELF_ROLE_CHANGE' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email already in use
      const emailDup = await prisma.employee.findFirst({
        where: { email, id: { not: id } },
      });
      if (emailDup) {
        return NextResponse.json(
          { error: 'Email already in use by another team member', code: 'DUPLICATE_EMAIL' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role as any;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userEmail: currentUser!.email,
        userName: currentUser!.name,
        role: currentUser!.role,
        action: 'UPDATE_EMPLOYEE',
        details: `Updated team member ${updatedEmployee.name} (${updatedEmployee.email}). Fields: ${Object.keys(updateData).join(', ')}`,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only Admin or Manager can delete employees
  const [currentUser, roleError] = await requireRole(['ADMIN', 'MANAGER']);
  if (roleError) return roleError;

  try {
    const { id } = await params;

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prevent user from deleting themselves
    if (id === currentUser!.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account', code: 'SELF_DELETION' },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userEmail: currentUser!.email,
        userName: currentUser!.name,
        role: currentUser!.role,
        action: 'DELETE_EMPLOYEE',
        details: `Deleted team member ${existing.name} (${existing.email || 'no email'})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
