import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { cleanString, cleanPhone, parsePositiveNumber, parseDate, validateStage, FIELD_LIMITS } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasks: { include: { assignedTo: { select: { name: true } } } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to load project', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Use transaction for atomicity — all updates succeed or none do
    const updated = await prisma.$transaction(async (tx) => {
      // Fetch existing project snapshot before modification
      const existing = await tx.project.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!existing) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const previousSnapshot: any = {
        name: existing.customer.name,
        callingNo: existing.customer.callingNo,
        mobile: existing.customer.mobile,
        caNumber: existing.customer.caNumber,
        division: existing.customer.division,
        location: existing.customer.location,
        capacity: existing.capacity,
        sourceOfLead: existing.sourceOfLead,
        brandModel: existing.brandModel,
        referral: existing.referral,
        amount: existing.amount,
        balance: existing.balance,
        stage: existing.stage,
        surveyStatus: existing.surveyStatus,
        poSigned: existing.poSigned,
        invoiceDate: existing.invoiceDate,
        incStage: existing.incStage,
        plantStatus: existing.plantStatus,
        docSubmitted: existing.docSubmitted,
        documentStatus: existing.documentStatus,
        meterTypeSl: existing.meterTypeSl,
        status: existing.status,
        sealingIndent: existing.sealingIndent,
        dcr: existing.dcr,
        instDetailSub: existing.instDetailSub,
        pcr: existing.pcr,
        subsidyRedeem: existing.subsidyRedeem,
      };

      // Sanitize & validate customer updates
      const customerFields: any = {};
      if (body.name !== undefined || body.customerName !== undefined) {
        const name = cleanString(body.name || body.customerName, FIELD_LIMITS.name);
        if (name) customerFields.name = name;
      }
      if (body.callingNo !== undefined) customerFields.callingNo = cleanPhone(body.callingNo);
      if (body.mobile !== undefined) customerFields.mobile = cleanPhone(body.mobile);
      if (body.caNumber !== undefined) customerFields.caNumber = cleanString(body.caNumber, FIELD_LIMITS.caNumber);
      if (body.division !== undefined) customerFields.division = cleanString(body.division, FIELD_LIMITS.division);
      if (body.location !== undefined) customerFields.location = cleanString(body.location, FIELD_LIMITS.location);

      if (Object.keys(customerFields).length > 0) {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: customerFields,
        });
      }

      // Sanitize & validate project updates
      const projectData: any = {};
      const stringFields = [
        'sourceOfLead', 'brandModel', 'referral', 'surveyStatus', 'poSigned',
        'incStage', 'plantStatus', 'docSubmitted', 'documentStatus', 'meterTypeSl',
        'status', 'sealingIndent', 'dcr', 'instDetailSub', 'pcr', 'subsidyRedeem',
      ] as const;

      for (const field of stringFields) {
        if (body[field] !== undefined) {
          projectData[field] = cleanString(body[field], (FIELD_LIMITS as any)[field] || 200);
        }
      }

      // Numeric fields
      if (body.capacity !== undefined) projectData.capacity = parsePositiveNumber(body.capacity);
      if (body.amount !== undefined) projectData.amount = parsePositiveNumber(body.amount);
      if (body.balance !== undefined) projectData.balance = parsePositiveNumber(body.balance);

      // Stage validation
      if (body.stage !== undefined) projectData.stage = validateStage(body.stage, existing.stage);

      // Date field
      if (body.invoiceDate !== undefined) {
        projectData.invoiceDate = body.invoiceDate ? parseDate(body.invoiceDate) : null;
      }

      const updatedProject = await tx.project.update({
        where: { id },
        data: projectData,
        include: { customer: true },
      });

      const newSnapshot: any = {
        name: updatedProject.customer.name,
        callingNo: updatedProject.customer.callingNo,
        mobile: updatedProject.customer.mobile,
        caNumber: updatedProject.customer.caNumber,
        division: updatedProject.customer.division,
        location: updatedProject.customer.location,
        capacity: updatedProject.capacity,
        sourceOfLead: updatedProject.sourceOfLead,
        brandModel: updatedProject.brandModel,
        referral: updatedProject.referral,
        amount: updatedProject.amount,
        balance: updatedProject.balance,
        stage: updatedProject.stage,
        surveyStatus: updatedProject.surveyStatus,
        poSigned: updatedProject.poSigned,
        invoiceDate: updatedProject.invoiceDate,
        incStage: updatedProject.incStage,
        plantStatus: updatedProject.plantStatus,
        docSubmitted: updatedProject.docSubmitted,
        documentStatus: updatedProject.documentStatus,
        meterTypeSl: updatedProject.meterTypeSl,
        status: updatedProject.status,
        sealingIndent: updatedProject.sealingIndent,
        dcr: updatedProject.dcr,
        instDetailSub: updatedProject.instDetailSub,
        pcr: updatedProject.pcr,
        subsidyRedeem: updatedProject.subsidyRedeem,
      };

      // Calculate diffs & create ActivityLog version records with employee tracking
      const diffs: any[] = [];
      for (const key of Object.keys(newSnapshot)) {
        const oldVal = previousSnapshot[key];
        const newVal = newSnapshot[key];
        const strOld = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? '');
        const strNew = newVal instanceof Date ? newVal.toISOString() : String(newVal ?? '');

        if (strOld !== strNew) {
          diffs.push({
            projectId: id,
            employeeId: user!.id,
            action: key === 'stage' ? 'STAGE_CHANGED' : 'UPDATE',
            fieldName: key,
            description: `${user!.name} updated ${key} from "${strOld || 'empty'}" to "${strNew || 'empty'}"`,
            oldValue: strOld,
            newValue: strNew,
            previousState: previousSnapshot,
            newState: newSnapshot,
          });
        }
      }

      if (diffs.length > 0) {
        await tx.activityLog.createMany({ data: diffs });
      }

      return updatedProject;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only ADMIN and MANAGER can delete records
  const [user, roleError] = await requireRole(['ADMIN', 'MANAGER']);
  if (roleError) return roleError;

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true } } },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Log deletion before deleting (cascade will remove project too)
    await prisma.auditLog.create({
      data: {
        userEmail: user!.email,
        userName: user!.name,
        role: user!.role,
        action: 'DELETE_RECORD',
        details: `Deleted customer "${project.customer.name}" (project ${id.slice(0, 8)})`,
      },
    });

    await prisma.customer.delete({ where: { id: project.customerId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
