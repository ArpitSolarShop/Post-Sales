import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is required in production');
    }
    // Dev fallback only — never used in production
    console.warn('[Prisma] DATABASE_URL not set, using local dev fallback');
    const devUrl = 'postgresql://postgres:password@localhost:5433/master_app?schema=public';
    const adapter = new PrismaPg({ connectionString: devUrl });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
