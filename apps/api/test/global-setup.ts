import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { seed } from '../prisma/seed';

/**
 * Runs once before the e2e suite: applies migrations to the test database
 * and loads the deterministic demo seed.
 * Requires DATABASE_URL / DIRECT_URL pointing to a disposable database.
 */
export default async function globalSetup() {
  process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret';
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit', cwd: `${__dirname}/..` });
  const prisma = new PrismaClient();
  await seed(prisma);
  await prisma.$disconnect();
}
