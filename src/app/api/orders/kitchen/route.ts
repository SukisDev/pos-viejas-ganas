import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

async function requireRoles(rolesAllowed: Array<'ADMIN' | 'CASHIER' | 'CHEF'>): Promise<{ error: NextResponse } | { userId: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME ?? 'vg_session')?.value;
  if (!token) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  
  const payload = await verifyAuthToken(token);
  if (!payload) return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  
  if (!rolesAllowed.includes(payload.role as 'ADMIN' | 'CASHIER' | 'CHEF')) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  
  return { userId: payload.sub };
}

export async function GET() {
  const auth = await requireRoles(['ADMIN', 'CHEF']);
  if ('error' in auth) return auth.error;

  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: 'IN_KITCHEN' 
      },
      orderBy: [
        { businessDate: 'asc' },
        { number: 'asc' }
      ],
      select: {
        id: true,
        number: true,
        businessDate: true,
        status: true,
        beeperId: true,
        total: true,
        createdAt: true,
        notes: true,
        cashier: {
          select: {
            username: true,
            name: true
          }
        },
        items: {
          select: {
            id: true,
            qty: true,
            unitPrice: true,
            lineTotal: true,
            customName: true,
            notes: true,
            product: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(orders);

  } catch (error: unknown) {
    console.error('Error obteniendo pedidos de cocina:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
