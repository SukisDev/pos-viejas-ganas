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
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const getCategoriesOnly = url.searchParams.get('categoriesOnly') === 'true';

    // Si solo se solicitan categorías
    if (getCategoriesOnly) {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        where: {
          category: {
            not: null
          }
        },
        _count: {
          category: true
        },
        orderBy: {
          category: 'asc'
        }
      });

      const result = categories.map(cat => ({
        name: cat.category,
        count: cat._count.category
      }));

      return NextResponse.json(result);
    }

    const where: Record<string, string> = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    });

    const result = products.map(product => ({
      ...product,
      price: Number(product.price),
      orderCount: product._count.orderItems,
      isActive: product.active
    }));

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error obteniendo productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { name, category, price }: { name: string; category: string; price: number } = await request.json();

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'name, category y price requeridos' }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ error: 'El precio debe ser positivo' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: name.trim(),
        category: category.trim()
      }
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Ya existe un producto con ese nombre en la categoría' }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        price: price,
        active: true
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        active: true,
        createdAt: true
      }
    });

    // Eliminar productos temporales de esta categoría ya que ahora tiene un producto real
    await prisma.product.deleteMany({
      where: {
        category: category.trim(),
        name: {
          startsWith: '_TEMP_'
        }
      }
    });

    const result = {
      ...product,
      price: Number(product.price),
      isActive: product.active
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creando producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { productId, name, category, price, isActive }: {
      productId: string;
      name?: string;
      category?: string;
      price?: number;
      isActive?: boolean;
    } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 });
    }

    const updateData: Record<string, string | number | boolean> = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (price !== undefined) {
      if (price < 0) {
        return NextResponse.json({ error: 'El precio debe ser positivo' }, { status: 400 });
      }
      updateData.price = price;
    }
    if (isActive !== undefined) updateData.active = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Al menos un campo para actualizar' }, { status: 400 });
    }

    // Verificar si existe el producto
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Si se actualiza nombre o categoría, verificar duplicados
    if (updateData.name || updateData.category) {
      const checkName = updateData.name as string || existingProduct.name;
      const checkCategory = updateData.category as string || existingProduct.category;
      
      const duplicate = await prisma.product.findFirst({
        where: {
          name: checkName,
          category: checkCategory,
          id: { not: productId }
        }
      });

      if (duplicate) {
        return NextResponse.json({ error: 'Ya existe un producto con ese nombre en la categoría' }, { status: 409 });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        active: true,
        createdAt: true
      }
    });

    const result = {
      ...updatedProduct,
      price: Number(updatedProduct.price),
      isActive: updatedProduct.active
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error actualizando producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 });
    }

    // Verificar si el producto tiene pedidos asociados
    const ordersCount = await prisma.orderItem.count({
      where: { productId }
    });

    if (ordersCount > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. El producto tiene ${ordersCount} pedidos asociados. Desactívalo en su lugar.` 
      }, { status: 409 });
    }

    // Obtener la categoría del producto antes de eliminarlo
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const category = product.category;

    // Eliminar el producto
    await prisma.product.delete({
      where: { id: productId }
    });

    // Verificar si quedan productos reales en esta categoría
    if (category) {
      const remainingRealProducts = await prisma.product.count({
        where: {
          category: category,
          name: {
            not: {
              startsWith: '_TEMP_'
            }
          }
        }
      });

      // Si no quedan productos reales, crear un producto temporal para mantener la categoría
      if (remainingRealProducts === 0) {
        await prisma.product.create({
          data: {
            name: `_TEMP_${category}_${Date.now()}`,
            category: category,
            price: 0.01,
            active: false
          }
        });
      }
    }

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    console.error('Error eliminando producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { action, fromCategory, toCategory } = await request.json();

    if (action === 'moveAll') {
      if (!fromCategory || !toCategory) {
        return NextResponse.json({ error: 'Se requieren ambas categorías' }, { status: 400 });
      }

      if (fromCategory === toCategory) {
        return NextResponse.json({ error: 'Las categorías no pueden ser iguales' }, { status: 400 });
      }

      // Mover todos los productos de fromCategory a toCategory
      const result = await prisma.product.updateMany({
        where: {
          category: fromCategory
        },
        data: {
          category: toCategory
        }
      });

      return NextResponse.json({ 
        message: `${result.count} productos movidos de "${fromCategory}" a "${toCategory}"`,
        count: result.count
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en PUT /api/admin/products:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
