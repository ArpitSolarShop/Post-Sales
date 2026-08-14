import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authError] = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { activityId } = await request.json();

    if (!activityId || typeof activityId !== 'string') {
      return NextResponse.json(
        { error: 'Activity ID required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Use transaction for atomicity
    const restoredProject = await prisma.$transaction(async (tx) => {
      const activity = await tx.activityLog.findUnique({
        where: { id: activityId },
      });

      if (!activity || !activity.previousState) {
        throw new Error('ACTIVITY_NOT_FOUND');
      }

      const project = await tx.project.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const prevState = activity.previousState as any;

      // Restore customer
      await tx.customer.update({
        where: { id: project.customerId },
        data: {
          name: prevState.name || project.customer.name,
          callingNo: prevState.callingNo ?? null,
          mobile: prevState.mobile ?? null,
          caNumber: prevState.caNumber ?? null,
          division: prevState.division ?? null,
          location: prevState.location ?? null,
        },
      });

      // Restore project
      const restored = await tx.project.update({
        where: { id },
        data: {
          capacity: prevState.capacity ? parseFloat(prevState.capacity) : null,
          sourceOfLead: prevState.sourceOfLead ?? null,
          brandModel: prevState.brandModel ?? null,
          referral: prevState.referral ?? null,
          amount: prevState.amount ? parseFloat(prevState.amount) : null,
          balance: prevState.balance ? parseFloat(prevState.balance) : null,
          stage: prevState.stage || project.stage,
          surveyStatus: prevState.surveyStatus ?? null,
          poSigned: prevState.poSigned ?? null,
          invoiceDate: prevState.invoiceDate ? new Date(prevState.invoiceDate) : null,
          incStage: prevState.incStage ?? null,
          plantStatus: prevState.plantStatus ?? null,
          docSubmitted: prevState.docSubmitted ?? null,
          documentStatus: prevState.documentStatus ?? null,
          meterTypeSl: prevState.meterTypeSl ?? null,
          status: prevState.status ?? null,
          sealingIndent: prevState.sealingIndent ?? null,
          dcr: prevState.dcr ?? null,
          instDetailSub: prevState.instDetailSub ?? null,
          pcr: prevState.pcr ?? null,
          subsidyRedeem: prevState.subsidyRedeem ?? null,
        },
        include: { customer: true },
      });

      // Record Revert action in log with employee tracking
      await tx.activityLog.create({
        data: {
          projectId: id,
          employeeId: user!.id,
          action: 'REVERT',
          fieldName: activity.fieldName,
          description: `${user!.name} reverted ${activity.fieldName || 'change'} back to "${activity.oldValue || 'previous state'}"`,
          oldValue: activity.newValue,
          newValue: activity.oldValue,
        },
      });

      return restored;
    });

    return NextResponse.json(restoredProject);
  } catch (error: any) {
    if (error.message === 'ACTIVITY_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Activity or version snapshot not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Revert error:', error);
    return NextResponse.json(
      { error: 'Failed to revert version', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
