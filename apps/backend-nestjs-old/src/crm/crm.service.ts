import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // Customers
  async getAllCustomers() {
    return this.prisma.customer.findMany({
      include: { projects: true }
    });
  }

  async createCustomer(data: any) {
    return this.prisma.customer.create({ data });
  }

  // Projects
  async getAllProjects() {
    return this.prisma.project.findMany({
      include: { customer: true }
    });
  }

  async getProjectsForTechnician() {
    // Hide financial details (amount, balance) for technicians
    return this.prisma.project.findMany({
      select: {
        id: true,
        capacity: true,
        brandModel: true,
        plantStatus: true,
        surveyStatus: true,
        incStage: true,
        customer: {
          select: {
            name: true,
            location: true,
            mobile: true
          }
        }
      }
    });
  }

  async updateProjectStatus(id: string, updateData: any) {
    return this.prisma.project.update({
      where: { id },
      data: updateData
    });
  }
}
