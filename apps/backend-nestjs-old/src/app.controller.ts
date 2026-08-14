import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ClerkAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  getAdminData() {
    return {
      message: 'Welcome to the admin dashboard! You have successfully passed the RBAC guard.',
    };
  }

  @UseGuards(ClerkAuthGuard)
  @Post('ai/query')
  async queryAi(@Body() body: { query: string }) {
    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new HttpException('AI Service Error', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException('Failed to communicate with AI service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
