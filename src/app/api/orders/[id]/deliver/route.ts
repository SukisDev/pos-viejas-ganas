import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../../../lib/auth';

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(['ADMIN', 'CASHIER']);
  if ('error' in auth) return auth.error;

  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    // Transacción para entregar pedido y liberar beeper
    const result = await prisma.$transaction(async (tx) => {
      // Buscar el pedido
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          number: true,
          beeperId: true
        }
      });

      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      if (order.status !== 'READY') {
        throw new Error('El pedido no está listo para entregar');
      }

      // Actualizar pedido a DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          id: true,
          number: true,
          status: true,
          beeperId: true,
          total: true,
          deliveredAt: true,
          updatedAt: true
        }
      });

      // Liberar beeper (cambiar a AVAILABLE)
      await tx.beeper.update({
        where: { id: order.beeperId },
        data: {
          status: 'AVAILABLE',
          updatedAt: new Date()
        }
      });

      return updatedOrder;
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Pedido no encontrado')) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    if (errorMessage.includes('no está listo para entregar')) {
      return NextResponse.json({ error: 'El pedido no está listo para entregar' }, { status: 409 });
    }

    console.error('Error entregando pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
