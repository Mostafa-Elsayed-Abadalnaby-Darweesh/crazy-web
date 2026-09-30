import { PrismaClient } from "@prisma/client";

/**
 * Prisma is optional: without DATABASE_URL the app runs in local (browser storage) mode and the
 * API routes report that no database is configured.
 */
const g = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!g.prisma) g.prisma = new PrismaClient();
  return g.prisma;
}
