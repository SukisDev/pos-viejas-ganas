import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../../../lib/auth';

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

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    // Obtener todas las fechas únicas donde hay pedidos
    const orders = await prisma.order.findMany({
      select: {
        businessDate: true
      },
      orderBy: {
        businessDate: 'desc'
      }
    });

    console.log('Orders found:', orders.length);

    // Agrupar por fecha y contar pedidos
    const dateGroups = new Map<string, { date: Date, count: number }>();
    
    orders.forEach(order => {
      const dateKey = order.businessDate.toISOString().split('T')[0];
      if (dateGroups.has(dateKey)) {
        dateGroups.get(dateKey)!.count++;
      } else {
        dateGroups.set(dateKey, {
          date: order.businessDate,
          count: 1
        });
      }
    });

    console.log('Date groups:', dateGroups.size);

    // Convertir a array y agrupar por mes
    const datesWithOrders = Array.from(dateGroups.entries()).map(([dateKey, info]) => ({
      date: dateKey,
      count: info.count,
      fullDate: info.date
    }));

    // Agrupar por mes/año
    const monthGroups = new Map<string, typeof datesWithOrders>();
    
    datesWithOrders.forEach(dateInfo => {
      const date = new Date(dateInfo.fullDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(dateInfo);
    });

    // Convertir a formato final
    const result = Array.from(monthGroups.entries()).map(([monthKey, dates]) => {
      const [year, month] = monthKey.split('-');
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      return {
        monthKey,
        monthName: monthNames[parseInt(month) - 1],
        year: parseInt(year),
        month: parseInt(month),
        dates: dates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    });

    const finalResult = result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    console.log('Final result:', finalResult);

    return NextResponse.json({ 
      success: true, 
      monthsWithOrders: finalResult
    });

  } catch (error) {
    console.error('Error fetching order dates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
