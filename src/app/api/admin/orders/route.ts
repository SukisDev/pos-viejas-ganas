import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME ?? 'vg_session')?.value;
  if (!token) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  
  const payload = await verifyAuthToken(token);
  if (!payload) return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  
  if (payload.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Solo administradores' }, { status: 403 }) };
  }
  
  return { userId: payload.sub };
}

export async function GET(request: Request) {
  // Temporalmente comentado para testing final
  // const auth = await requireAdmin();
  // if ('error' in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = {} as any;
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      where.businessDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (search) {
      const searchNumber = parseInt(search);
      if (!isNaN(searchNumber)) {
        where.number = searchNumber;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: [
          { businessDate: 'desc' },
          { number: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          number: true,
          businessDate: true,
          status: true,
          beeperId: true,
          total: true,
          createdAt: true,
          deliveredAt: true,
          notes: true,
          cashier: {
            select: {
              username: true,
              name: true
            }
          },
          chef: {
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
      }),
      prisma.order.count({ where })
    ]);

    const result = {
      orders: orders.map(order => {
        // Calcular el total correcto basado en los items
        const calculatedTotal = order.items.reduce((sum, item) => {
          return sum + Number(item.lineTotal);
        }, 0);
        
        return {
          ...order,
          total: calculatedTotal, // Usar el total calculado en lugar del de la DB
          items: order.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal)
          }))
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error obteniendo pedidos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { orderId, status }: { orderId: string; status: string } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId y status requeridos' }, { status: 400 });
    }

    if (!['IN_KITCHEN', 'READY', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, beeperId: true }
      });

      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status as 'IN_KITCHEN' | 'READY' | 'DELIVERED' | 'CANCELLED',
          ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          ...(status === 'CANCELLED' ? { deliveredAt: new Date() } : {})
        },
        select: {
          id: true,
          number: true,
          status: true,
          beeperId: true
        }
      });

      // Si se cancela o entrega, liberar beeper
      if ((status === 'CANCELLED' || status === 'DELIVERED') && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        await tx.beeper.update({
          where: { id: order.beeperId },
          data: { status: 'AVAILABLE' }
        });
      }

      return updatedOrder;
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('no encontrado')) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    console.error('Error actualizando pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
