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
  const auth = await requireRoles(['ADMIN', 'CHEF']);
  if ('error' in auth) return auth.error;

  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    // Buscar y actualizar el pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        number: true,
        beeperId: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.status !== 'IN_KITCHEN') {
      return NextResponse.json({ error: 'El pedido no está en cocina' }, { status: 409 });
    }

    // Actualizar pedido a READY
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY',
        chefId: auth.userId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        number: true,
        status: true,
        beeperId: true,
        total: true,
        chefId: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedOrder);

  } catch (error: unknown) {
    console.error('Error marcando pedido como listo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
