import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../lib/auth';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

async function requireRoles(rolesAllowed: Array<'ADMIN' | 'CASHIER'>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME ?? 'vg_session')?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const payload = await verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  if (!rolesAllowed.includes(payload.role as 'ADMIN' | 'CASHIER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return null as const;
}

export async function GET() {
  const guard = await requireRoles(['ADMIN', 'CASHIER']);
  if (guard) return guard;

  // Disponible por status, y además ignoramos beepers que estén asociados a pedidos activos (paso siguiente)
  const beepers = await prisma.beeper.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { id: 'asc' },
    select: { id: true, status: true },
  });

  return NextResponse.json(beepers);
}
