// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Declaramos la config completa (incluye `seed`)
const config = {
  schema: 'prisma/schema.prisma',
  seed: 'node prisma/seed.mjs',
} as const;

// La casteamos al tipo que espera defineConfig (workaround de tipos en Prisma 6)
export default defineConfig(config as unknown as Parameters<typeof defineConfig>[0]);
