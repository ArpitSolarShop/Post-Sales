import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.employee.findFirst({ where: { email } });
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(data: any) {
    const existing = await this.prisma.employee.findFirst({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'TECHNICIAN',
      },
    });
    const { password, ...result } = user;
    return result;
  }
}
