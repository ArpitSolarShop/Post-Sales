import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProjectStage } from '@prisma/client';

// Defines the valid pipeline order
const STAGE_ORDER: ProjectStage[] = [
  'LEAD_CAPTURED',
  'SURVEY_SCHEDULED',
  'SURVEY_COMPLETED',
  'PO_SIGNED',
  'INVOICED',
  'INC_IN_PROGRESS',
  'PLANT_INSTALLED',
  'DOC_SUBMITTED',
  'DOC_VERIFIED',
  'METER_SEALING',
  'DCR_FILED',
  'INST_DETAIL_SUBMITTED',
  'PCR_FILED',
  'SUBSIDY_REDEEMED',
  'CLOSED',
];

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  getStageOrder() {
    return STAGE_ORDER;
  }

  getNextStage(currentStage: ProjectStage): ProjectStage | null {
    const idx = STAGE_ORDER.indexOf(currentStage);
    if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[idx + 1];
  }

  getPreviousStage(currentStage: ProjectStage): ProjectStage | null {
    const idx = STAGE_ORDER.indexOf(currentStage);
    if (idx <= 0) return null;
    return STAGE_ORDER[idx - 1];
  }

  async advanceProject(projectId: string, employeeId?: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { customer: true },
    });

    const nextStage = this.getNextStage(project.stage);
    if (!nextStage) {
      throw new Error(`Project is already at final stage: ${project.stage}`);
    }

    // Update the project stage
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { stage: nextStage },
    });

    // Log the activity
    await this.prisma.activityLog.create({
      data: {
        projectId,
        employeeId: employeeId || null,
        action: 'STAGE_CHANGED',
        description: `Project advanced from ${project.stage} to ${nextStage}`,
        oldValue: project.stage,
        newValue: nextStage,
      },
    });

    // Auto-create tasks based on the new stage
    await this.createAutoTasks(projectId, nextStage, employeeId);

    return updated;
  }

  async setProjectStage(projectId: string, stage: ProjectStage, employeeId?: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { stage },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId,
        employeeId: employeeId || null,
        action: 'STAGE_CHANGED',
        description: `Project stage set to ${stage} (was ${project.stage})`,
        oldValue: project.stage,
        newValue: stage,
      },
    });

    return updated;
  }

  private async createAutoTasks(projectId: string, stage: ProjectStage, employeeId?: string) {
    const taskTemplates: Record<string, { title: string; description: string }> = {
      SURVEY_SCHEDULED: {
        title: 'Conduct Site Survey',
        description: 'Visit customer location, assess roof structure, take measurements and photos.',
      },
      PO_SIGNED: {
        title: 'Generate Invoice',
        description: 'Create invoice based on signed PO and send to customer.',
      },
      INC_IN_PROGRESS: {
        title: 'Complete Installation & Commissioning',
        description: 'Install solar panels, inverter, and complete wiring. Commission the system.',
      },
      PLANT_INSTALLED: {
        title: 'Submit DISCOM Documents',
        description: 'Prepare and submit all required documentation to DISCOM for net metering.',
      },
      DOC_VERIFIED: {
        title: 'Schedule Meter Sealing',
        description: 'Coordinate with DISCOM for meter sealing/indent appointment.',
      },
      DCR_FILED: {
        title: 'Submit Installation Details',
        description: 'File installation detail submission with DISCOM.',
      },
      PCR_FILED: {
        title: 'Process Subsidy Redemption',
        description: 'Initiate subsidy redemption process with relevant authority.',
      },
    };

    const template = taskTemplates[stage];
    if (!template || !employeeId) return;

    await this.prisma.taskAssignment.create({
      data: {
        projectId,
        assignedToId: employeeId,
        title: template.title,
        description: template.description,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Send notification
    await this.prisma.notification.create({
      data: {
        employeeId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned: ${template.title}`,
        actionUrl: `/project/${projectId}`,
      },
    });
  }

  // ─── Dashboard KPI Queries ─────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalCustomers,
      totalProjects,
      stageBreakdown,
      recentActivity,
      openTasks,
      totalRevenue,
      totalBalance,
      discomIssues,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.project.count(),
      this.prisma.project.groupBy({
        by: ['stage'],
        _count: { id: true },
        orderBy: { stage: 'asc' },
      }),
      this.prisma.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { project: { include: { customer: true } }, employee: true },
      }),
      this.prisma.taskAssignment.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      this.prisma.project.aggregate({ _sum: { amount: true } }),
      this.prisma.project.aggregate({ _sum: { balance: true } }),
      this.prisma.discomIssue.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      totalCustomers,
      totalProjects,
      stageBreakdown: stageBreakdown.map((s) => ({
        stage: s.stage,
        count: s._count.id,
      })),
      recentActivity,
      openTasks,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalBalance: totalBalance._sum.balance || 0,
      openDiscomIssues: discomIssues,
    };
  }

  // ─── Employee Task Queries ─────────────────────────────────────────────────

  async getEmployeeTasks(employeeId: string) {
    return this.prisma.taskAssignment.findMany({
      where: { assignedToId: employeeId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { project: { include: { customer: true } } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async completeTask(taskId: string, employeeId: string) {
    const task = await this.prisma.taskAssignment.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        employeeId,
        action: 'TASK_COMPLETED',
        description: `Task completed: ${task.title}`,
      },
    });

    return task;
  }

  async getEmployeeNotifications(employeeId: string) {
    return this.prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
