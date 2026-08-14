import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma.service';
import { ClerkAuthGuard } from '../auth.guard';
import { ProjectStage } from '@prisma/client';

@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  async getDashboard() {
    return this.workflowService.getDashboardStats();
  }

  @Get('stages')
  getStages() {
    return this.workflowService.getStageOrder();
  }

  // ─── Projects Pipeline ─────────────────────────────────────────────────────

  @Get('projects')
  async getProjects(
    @Query('stage') stage?: ProjectStage,
    @Query('search') search?: string,
  ) {
    const where: any = {};
    if (stage) where.stage = stage;
    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.project.findMany({
      where,
      include: { customer: true, tasks: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get('projects/:id')
  async getProjectDetail(@Param('id') id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        tasks: { include: { assignedTo: true }, orderBy: { createdAt: 'desc' } },
        activities: { include: { employee: true }, orderBy: { createdAt: 'desc' }, take: 30 },
        netMeterFiles: true,
      },
    });
  }

  @Patch('projects/:id/advance')
  async advanceProject(
    @Param('id') id: string,
    @Body() body: { employeeId?: string },
  ) {
    return this.workflowService.advanceProject(id, body.employeeId);
  }

  @Patch('projects/:id/stage')
  async setProjectStage(
    @Param('id') id: string,
    @Body() body: { stage: ProjectStage; employeeId?: string },
  ) {
    return this.workflowService.setProjectStage(id, body.stage, body.employeeId);
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  @Get('tasks')
  async getTasks(@Query('employeeId') employeeId?: string) {
    if (employeeId) {
      return this.workflowService.getEmployeeTasks(employeeId);
    }
    return this.prisma.taskAssignment.findMany({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { project: { include: { customer: true } }, assignedTo: true },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  @Post('tasks')
  async createTask(@Body() body: {
    projectId?: string;
    assignedToId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }) {
    const task = await this.prisma.taskAssignment.create({
      data: {
        projectId: body.projectId || null,
        assignedToId: body.assignedToId,
        title: body.title,
        description: body.description,
        priority: (body.priority as any) || 'MEDIUM',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    // Notify the assigned employee
    await this.prisma.notification.create({
      data: {
        employeeId: body.assignedToId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned: ${body.title}`,
        actionUrl: body.projectId ? `/project/${body.projectId}` : undefined,
      },
    });

    return task;
  }

  @Patch('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() body: { employeeId: string },
  ) {
    return this.workflowService.completeTask(id, body.employeeId);
  }

  // ─── Employees ─────────────────────────────────────────────────────────────

  @Get('employees')
  async getEmployees() {
    return this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { assignedTasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } } } },
        schedule: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('employees')
  async createEmployee(@Body() body: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    password?: string;
  }) {
    return this.prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: (body.role as any) || 'TECHNICIAN',
        password: body.password || '', // Need a default password or handle via AuthModule
      },
    });
  }

  // ─── Notifications ─────────────────────────────────────────────────────────

  @Get('notifications/:employeeId')
  async getNotifications(@Param('employeeId') employeeId: string) {
    return this.workflowService.getEmployeeNotifications(employeeId);
  }

  @Patch('notifications/:id/read')
  async markRead(@Param('id') id: string) {
    return this.workflowService.markNotificationRead(id);
  }

  // ─── Activity Log ──────────────────────────────────────────────────────────

  @Get('activity')
  async getActivity(@Query('projectId') projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    return this.prisma.activityLog.findMany({
      where,
      include: { project: { include: { customer: true } }, employee: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ─── DISCOM Issues ─────────────────────────────────────────────────────────

  @Get('discom')
  async getDiscomIssues(@Query('status') status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.discomIssue.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('discom')
  async createDiscomIssue(@Body() body: {
    customerId?: string;
    customerName?: string;
    caNumber?: string;
    division?: string;
    mobile?: string;
    issueDesc?: string;
  }) {
    return this.prisma.discomIssue.create({
      data: {
        ...body,
        date: new Date(),
        status: 'OPEN',
      },
    });
  }

  @Patch('discom/:id')
  async updateDiscomIssue(
    @Param('id') id: string,
    @Body() body: { remark?: string; status?: string },
  ) {
    return this.prisma.discomIssue.update({
      where: { id },
      data: {
        ...body,
        resolvedAt: body.status === 'CLOSED' ? new Date() : undefined,
      },
    });
  }
}
