import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { ClerkAuthGuard } from '../auth.guard';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // -------------------------
  // ADMIN ONLY ENDPOINTS
  // -------------------------
  @Roles('admin')
  @Get('customers')
  getCustomers() {
    return this.crmService.getAllCustomers();
  }

  @Roles('admin')
  @Post('customers')
  createCustomer(@Body() data: any) {
    return this.crmService.createCustomer(data);
  }

  @Roles('admin')
  @Get('projects/all')
  getAllProjects() {
    // Returns full financial data
    return this.crmService.getAllProjects();
  }

  // -------------------------
  // USER / TECHNICIAN ENDPOINTS
  // -------------------------
  // Users (technicians) don't need 'admin' role, they just need to be authenticated.
  // We can leave @Roles() empty or omit it since RolesGuard passes if no roles are required.
  
  @Get('projects/technician')
  getTechnicianProjects() {
    // Returns restricted data (no amounts/balances)
    return this.crmService.getProjectsForTechnician();
  }

  @Patch('projects/:id/status')
  updateProjectStatus(@Param('id') id: string, @Body() body: any) {
    // Allow technicians to update operational statuses like 'plantStatus'
    return this.crmService.updateProjectStatus(id, body);
  }
}
