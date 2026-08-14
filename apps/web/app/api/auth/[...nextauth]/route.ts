import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(email: string): boolean {
  const key = email.toLowerCase();
  const record = loginAttempts.get(key);
  if (!record) return false;

  // Reset if window has expired
  if (Date.now() - record.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(email: string) {
  const key = email.toLowerCase();
  const record = loginAttempts.get(key);
  if (!record || Date.now() - record.lastAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, lastAttempt: Date.now() });
  } else {
    record.count++;
    record.lastAttempt = Date.now();
  }
}

function clearAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@arpitsolar.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limiting check
        if (isRateLimited(credentials.email)) {
          await prisma.auditLog.create({
            data: {
              userEmail: credentials.email,
              action: 'LOGIN_RATE_LIMITED',
              details: `Too many failed login attempts. Locked for 15 minutes.`,
            },
          });
          return null;
        }

        try {
          // Get request metadata for audit logging
          let ipAddress: string | null = null;
          let userAgent: string | null = null;
          try {
            const headersList = await headers();
            ipAddress = headersList.get('x-forwarded-for')
              || headersList.get('x-real-ip')
              || 'unknown';
            userAgent = headersList.get('user-agent') || 'unknown';
          } catch {
            // headers() may fail in some contexts
          }

          const employee = await prisma.employee.findUnique({
            where: { email: credentials.email },
          });

          if (!employee || !employee.password) {
            recordFailedAttempt(credentials.email);
            await prisma.auditLog.create({
              data: {
                userEmail: credentials.email,
                action: 'LOGIN_FAILED',
                ipAddress,
                userAgent,
                details: 'User not found or missing password',
              },
            });
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, employee.password);
          if (!isValid) {
            recordFailedAttempt(credentials.email);
            await prisma.auditLog.create({
              data: {
                userEmail: credentials.email,
                userName: employee.name,
                role: employee.role,
                action: 'LOGIN_FAILED',
                ipAddress,
                userAgent,
                details: 'Invalid password provided',
              },
            });
            return null;
          }

          // Successful login — clear rate limit and log
          clearAttempts(credentials.email);
          await prisma.auditLog.create({
            data: {
              userEmail: employee.email,
              userName: employee.name,
              role: employee.role,
              action: 'LOGIN_SUCCESS',
              ipAddress,
              userAgent,
              details: 'Successful credentials authentication',
            },
          });

          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
          };
        } catch (error) {
          console.error("Auth Error", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — sessions auto-expire for production security
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
