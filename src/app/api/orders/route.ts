import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../lib/auth';

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

function getPanamaDate(): Date {
  // SOLUCIÓN SIMPLE: obtener fecha de hoy en formato consistente
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Panama' });
  return new Date(today + 'T00:00:00.000Z');
}

interface OrderItemRequest {
  productId?: string;
  customName?: string;
  qty: number;
  unitPrice?: number;
  notes?: string;
}

interface CreateOrderRequest {
  items: OrderItemRequest[];
  beeperId: number;
  notes?: string;
}

export async function POST(request: Request) {
  const auth = await requireRoles(['ADMIN', 'CASHIER']);
  if ('error' in auth) return auth.error;

  try {
    const body: CreateOrderRequest = await request.json();
    const { items, beeperId, notes } = body;

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 });
    }

    if (!beeperId || typeof beeperId !== 'number') {
      return NextResponse.json({ error: 'BeeperId requerido' }, { status: 400 });
    }

    // Validar items
    for (const item of items) {
      if (!item.qty || item.qty <= 0) {
        return NextResponse.json({ error: 'Cantidad debe ser mayor a 0' }, { status: 400 });
      }
      
      if (!item.productId && !item.customName) {
        return NextResponse.json({ error: 'Producto o nombre custom requerido' }, { status: 400 });
      }
      
      if (item.customName && !item.unitPrice) {
        return NextResponse.json({ error: 'Precio requerido para productos custom' }, { status: 400 });
      }
    }

    const businessDate = getPanamaDate();

    // Transacción
    const result = await prisma.$transaction(async (tx) => {
      // Verificar beeper disponible
      const beeper = await tx.beeper.findUnique({
        where: { id: beeperId },
      });

      if (!beeper) {
        throw new Error('Beeper no encontrado');
      }

      if (beeper.status !== 'AVAILABLE') {
        throw new Error('Beeper no disponible');
      }

      // Obtener/crear/incrementar contador diario
      const counter = await tx.dailyCounter.upsert({
        where: { businessDate },
        update: { lastValue: { increment: 1 } },
        create: { businessDate, lastValue: 1 },
      });

      const orderNumber = counter.lastValue;

      // Cambiar beeper a IN_USE
      await tx.beeper.update({
        where: { id: beeperId },
        data: { status: 'IN_USE' },
      });

      // Preparar items con precios
      const orderItemsData = [];
      let total = 0;

      for (const item of items) {
        let unitPrice: number;

        if (item.productId) {
          // Producto del catálogo
          const product = await tx.product.findUnique({
            where: { id: item.productId, active: true },
          });

          if (!product) {
            throw new Error(`Producto ${item.productId} no encontrado`);
          }

          unitPrice = Number(product.price);
        } else {
          // Producto custom
          unitPrice = item.unitPrice!;
        }

        const lineTotal = unitPrice * item.qty;
        total += lineTotal;

        orderItemsData.push({
          productId: item.productId || null,
          customName: item.customName || null,
          qty: item.qty,
          unitPrice,
          lineTotal,
          notes: item.notes || null,
        });
      }

      // Crear orden
      const order = await tx.order.create({
        data: {
          number: orderNumber,
          businessDate,
          status: 'IN_KITCHEN',
          total,
          beeperId,
          cashierId: auth.userId,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
        },
        select: {
          id: true,
          number: true,
          status: true,
          beeperId: true,
          total: true,
        },
      });

      return order;
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Beeper no encontrado')) {
      return NextResponse.json({ error: 'Beeper no encontrado' }, { status: 404 });
    }
    if (errorMessage.includes('Beeper no disponible')) {
      return NextResponse.json({ error: 'Beeper no disponible' }, { status: 409 });
    }
    if (errorMessage.includes('Producto') && errorMessage.includes('no encontrado')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    console.error('Error creando pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
