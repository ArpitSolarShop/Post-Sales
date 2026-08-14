import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
export const ClerkAuthGuard = JwtAuthGuard; // Alias for backward compatibility if needed, but better to rename it in controllers.
