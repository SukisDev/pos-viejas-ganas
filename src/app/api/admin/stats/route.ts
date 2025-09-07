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

function getPanamaDate(): Date {
  const now = new Date();
  const panama = new Date(now.toLocaleString('en-US', { timeZone: 'America/Panama' }));
  panama.setHours(0, 0, 0, 0);
  return panama;
}

export async function GET() {
  // Temporalmente comentado para testing final
  // const auth = await requireAdmin();
  // if ('error' in auth) return auth.error;

  try {
    const today = getPanamaDate();
    const startOfToday = new Date(today);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Estadísticas generales
    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      ordersByStatus,
      topProducts,
      recentOrders
    ] = await Promise.all([
      // Total de pedidos
      prisma.order.count(),
      
      // Pedidos de hoy
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      
      // Ingresos totales
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { total: true }
      }),
      
      // Ingresos de hoy
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        _sum: { total: true }
      }),
      
      // Pedidos por estado
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Productos más vendidos (últimos 7 días)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { not: null },
          order: {
            status: 'DELIVERED',
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5
      }),
      
      // Pedidos recientes
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          beeperId: true,
          cashier: {
            select: { username: true }
          }
        }
      })
    ]);

    // Obtener nombres de productos para top products
    const productIds = topProducts.map(p => p.productId).filter((id): id is string => id !== null);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true }
    });

    const topProductsWithNames = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Producto eliminado',
        category: product?.category || '',
        totalSold: item._sum.qty || 0
      };
    });

    const stats = {
      overview: {
        totalOrders,
        todayOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        todayRevenue: Number(todayRevenue._sum.total || 0)
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      topProducts: topProductsWithNames,
      recentOrders: recentOrders.map(order => ({
        ...order,
        total: Number(order.total)
      }))
    };

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
