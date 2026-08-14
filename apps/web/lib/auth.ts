import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'TECHNICIAN',
  };
}

/**
 * Require authentication. Returns the authenticated user or a 401 response.
 * Usage: const [user, errorRes] = await requireAuth();
 *        if (errorRes) return errorRes;
 */
export async function requireAuth(): Promise<[AuthUser | null, NextResponse | null]> {
  const user = await getAuthUser();
  if (!user) {
    return [
      null,
      NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    ];
  }
  return [user, null];
}

/**
 * Require the user to have one of the specified roles.
 * Returns a 403 response if the user's role is not in the allowed list.
 * Usage: const [user, errorRes] = await requireRole(['ADMIN', 'MANAGER']);
 *        if (errorRes) return errorRes;
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<[AuthUser | null, NextResponse | null]> {
  const [user, authError] = await requireAuth();
  if (authError) return [null, authError];

  if (!allowedRoles.includes(user!.role)) {
    return [
      null,
      NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          details: `Required role: ${allowedRoles.join(' or ')}. Your role: ${user!.role}`,
        },
        { status: 403 }
      ),
    ];
  }
  return [user, null];
}
