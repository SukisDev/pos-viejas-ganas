/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthCookieName, verifyAuthToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(getAuthCookieName());
    if (!authCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyAuthToken(authCookie.value);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Obtener parámetros de fecha
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('end') || new Date().toISOString().split('T')[0];

    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    // 1. Análisis de Ventas por Período
    const salesAnalysis = await prisma.order.groupBy({
      by: ['businessDate'],
      where: {
        status: { in: ['DELIVERED'] },
        createdAt: { gte: start, lte: end }
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { businessDate: 'asc' }
    });

    // 2. Análisis de Productos Más Vendidos
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'DELIVERED',
          createdAt: { gte: start, lte: end }
        }
      },
      _sum: { qty: true, lineTotal: true },
      _count: { id: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 10
    });

    // Obtener detalles de productos
    const productIds = topProducts.map((p: any) => p.productId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true, price: true }
    });

    const topProductsWithDetails = topProducts.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || 'Producto personalizado',
        category: product?.category || 'Sin categoría',
        avgPrice: item._sum.lineTotal && item._sum.qty ? 
          Number((item._sum.lineTotal / item._sum.qty).toFixed(2)) : 0
      };
    });

    // 3. Análisis de Categorías
    const categoryAnalysis = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'DELIVERED',
          createdAt: { gte: start, lte: end }
        }
      },
      _sum: { qty: true, lineTotal: true }
    });

    const categoryData: Record<string, { revenue: number, quantity: number, orders: number }> = {};
    
    for (const item of categoryAnalysis) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { category: true }
        });
        
        const category = product?.category || 'Sin categoría';
        if (!categoryData[category]) {
          categoryData[category] = { revenue: 0, quantity: 0, orders: 0 };
        }
        
        categoryData[category].revenue += Number(item._sum.lineTotal || 0);
        categoryData[category].quantity += Number(item._sum.qty || 0);
        categoryData[category].orders += 1;
      }
    }

    // 4. Análisis de Rendimiento por Usuario
    const userPerformance = await prisma.order.groupBy({
      by: ['cashierId'],
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end }
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } }
    });

    const userIds = userPerformance.map((u: any) => u.cashierId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, name: true, role: true }
    });

    const userPerformanceWithDetails = userPerformance.map((perf: any) => {
      const user = users.find((u: any) => u.id === perf.cashierId);
      return {
        ...perf,
        username: user?.username || 'Usuario desconocido',
        name: user?.name || '',
        role: user?.role || 'CASHIER',
        avgOrderValue: perf._sum.total && perf._count.id ? 
          Number((perf._sum.total / perf._count.id).toFixed(2)) : 0
      };
    });

    // 5. Análisis de Tiempos de Preparación
    const prepTimeAnalysis = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end },
        deliveredAt: { not: null }
      },
      select: {
        id: true,
        createdAt: true,
        deliveredAt: true,
        total: true
      }
    });

    const prepTimes = prepTimeAnalysis.map((order: any) => {
      if (order.deliveredAt) {
        const prepTime = (new Date(order.deliveredAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60); // minutos
        return {
          orderId: order.id,
          prepTimeMinutes: Math.round(prepTime),
          total: Number(order.total)
        };
      }
      return null;
    }).filter(Boolean);

    const avgPrepTime = prepTimes.length > 0 ? 
      prepTimes.reduce((acc: number, curr: any) => acc + (curr?.prepTimeMinutes || 0), 0) / prepTimes.length : 0;

    // 6. Análisis de Tendencias por Hora
    const hourlyAnalysis = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end }
      },
      select: {
        createdAt: true,
        total: true
      }
    });

    const hourlyData: Record<number, { orders: number, revenue: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { orders: 0, revenue: 0 };
    }

    hourlyAnalysis.forEach((order: any) => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += Number(order.total);
    });

    // 7. Análisis de Frecuencia de Clientes (basado en pedidos)
    const totalOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end }
      }
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end }
      },
      _sum: { total: true }
    });

    const avgOrderValue = totalOrders > 0 ? Number(totalRevenue._sum.total || 0) / totalOrders : 0;

    // 8. Análisis de días de la semana
    const weekdayAnalysis: Record<number, { orders: number, revenue: number }> = {};
    for (let i = 0; i < 7; i++) {
      weekdayAnalysis[i] = { orders: 0, revenue: 0 };
    }

    hourlyAnalysis.forEach((order: any) => {
      const weekday = new Date(order.createdAt).getDay();
      weekdayAnalysis[weekday].orders += 1;
      weekdayAnalysis[weekday].revenue += Number(order.total);
    });

    const analyticsResponse = {
      period: { start: startDate, end: endDate },
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        avgPrepTime: Number(avgPrepTime.toFixed(1))
      },
      salesTrend: salesAnalysis.map((day: any) => ({
        date: day.businessDate,
        orders: day._count.id,
        revenue: Number(day._sum.total || 0)
      })),
      topProducts: topProductsWithDetails,
      categoryAnalysis: Object.entries(categoryData).map(([category, data]) => ({
        category,
        ...data,
        avgOrderValue: data.orders > 0 ? Number((data.revenue / data.orders).toFixed(2)) : 0
      })),
      userPerformance: userPerformanceWithDetails,
      prepTimeAnalysis: {
        avgTime: Number(avgPrepTime.toFixed(1)),
        distribution: prepTimes.sort((a: any, b: any) => (a?.prepTimeMinutes || 0) - (b?.prepTimeMinutes || 0))
      },
      hourlyAnalysis: Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data,
        avgOrderValue: data.orders > 0 ? Number((data.revenue / data.orders).toFixed(2)) : 0
      })),
      weekdayAnalysis: Object.entries(weekdayAnalysis).map(([day, data]) => ({
        day: parseInt(day),
        dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][parseInt(day)],
        ...data,
        avgOrderValue: data.orders > 0 ? Number((data.revenue / data.orders).toFixed(2)) : 0
      }))
    };

    return NextResponse.json(analyticsResponse);

  } catch (error) {
    console.error('Error en analítica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
