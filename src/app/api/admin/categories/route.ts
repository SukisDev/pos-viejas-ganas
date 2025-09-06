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

// GET - Obtener todas las categorías (incluyendo vacías)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    // Obtener categorías que tienen productos
    const categoriesWithProducts = await prisma.product.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null
        }
      },
      orderBy: {
        category: 'asc'
      }
    });

    // Buscar categorías que fueron creadas pero que podrían no tener productos reales
    // Esto incluye las que solo tienen productos temporales o fueron creadas vacías
    const allDbCategories = await prisma.product.findMany({
      select: { category: true },
      where: {
        category: { not: null }
      },
      distinct: ['category']
    });

    // Crear un Set para evitar duplicados
    const allCategoryNames = new Set<string>();
    
    // Agregar categorías con productos
    categoriesWithProducts.forEach(cat => {
      if (cat.category) allCategoryNames.add(cat.category);
    });

    // Agregar todas las categorías de la DB (incluso con solo productos temporales)
    allDbCategories.forEach(cat => {
      if (cat.category) allCategoryNames.add(cat.category);
    });

    // Para cada categoría, contar solo los productos reales (no temporales)
    const formattedCategories = await Promise.all(
      Array.from(allCategoryNames).map(async (categoryName) => {
        const realProductsCount = await prisma.product.count({
          where: {
            category: categoryName,
            AND: [
              {
                NOT: {
                  name: {
                    startsWith: '_TEMP_'
                  }
                }
              },
              {
                NOT: {
                  name: {
                    startsWith: '_CATEGORY_MARKER_'
                  }
                }
              }
            ]
          }
        });

        return {
          name: categoryName,
          count: realProductsCount
        };
      })
    );

    // Ordenar por nombre
    formattedCategories.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva categoría (con registro persistente)
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nombre de categoría requerido' }, { status: 400 });
    }

    const categoryName = name.trim();

    // Verificar si la categoría ya existe
    const existingCategory = await prisma.product.findFirst({
      where: { category: categoryName }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'La categoría ya existe' }, { status: 400 });
    }

    // Crear un marcador invisible para mantener la categoría en la DB
    // Este producto no aparecerá en ningún listado ni interfiere con la funcionalidad
    await prisma.product.create({
      data: {
        name: `_CATEGORY_MARKER_${categoryName}_${Date.now()}`,
        category: categoryName,
        price: 0.01,
        active: false
      }
    });

    return NextResponse.json({ 
      message: 'Categoría creada exitosamente',
      category: categoryName
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH - Actualizar nombre de categoría
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { oldName, newName } = await request.json();

    if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
      return NextResponse.json({ error: 'Nombres de categoría requeridos' }, { status: 400 });
    }

    const oldCategoryName = oldName.trim();
    const newCategoryName = newName.trim();

    if (!oldCategoryName || !newCategoryName) {
      return NextResponse.json({ error: 'Nombres de categoría no pueden estar vacíos' }, { status: 400 });
    }

    if (oldCategoryName === newCategoryName) {
      return NextResponse.json({ error: 'El nuevo nombre debe ser diferente' }, { status: 400 });
    }

    // Verificar que la categoría antigua existe
    const oldCategoryExists = await prisma.product.findFirst({
      where: { category: oldCategoryName }
    });

    if (!oldCategoryExists) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    // Verificar que la nueva categoría no existe
    const newCategoryExists = await prisma.product.findFirst({
      where: { category: newCategoryName }
    });

    if (newCategoryExists) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 });
    }

    // Actualizar todos los productos de la categoría
    const updateResult = await prisma.product.updateMany({
      where: { category: oldCategoryName },
      data: { category: newCategoryName }
    });

    return NextResponse.json({ 
      message: 'Categoría actualizada exitosamente',
      updatedProducts: updateResult.count
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const categoryName = url.searchParams.get('name');

    if (!categoryName) {
      return NextResponse.json({ error: 'Nombre de categoría requerido' }, { status: 400 });
    }

    // Verificar cuántos productos reales tiene la categoría
    const productCount = await prisma.product.count({
      where: { 
        category: categoryName,
        AND: [
          {
            NOT: {
              name: {
                startsWith: '_TEMP_'
              }
            }
          },
          {
            NOT: {
              name: {
                startsWith: '_CATEGORY_MARKER_'
              }
            }
          }
        ]
      }
    });

    if (productCount > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar la categoría porque tiene ${productCount} producto(s). Mueve o elimina los productos primero.`,
        productCount
      }, { status: 400 });
    }

    // Eliminar productos temporales y marcadores de la categoría
    const deleteResult = await prisma.product.deleteMany({
      where: { 
        category: categoryName,
        OR: [
          {
            name: {
              startsWith: '_TEMP_'
            }
          },
          {
            name: {
              startsWith: '_CATEGORY_MARKER_'
            }
          }
        ]
      }
    });

    return NextResponse.json({ 
      message: 'Categoría eliminada exitosamente',
      deletedTempProducts: deleteResult.count
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Limpiar productos temporales
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { action } = await request.json();

    if (action === 'cleanup_temp') {
      // Eliminar TODOS los productos temporales y marcadores
      const deleteResult = await prisma.product.deleteMany({
        where: {
          OR: [
            {
              name: {
                startsWith: '_TEMP_'
              }
            },
            {
              name: {
                startsWith: '_CATEGORY_MARKER_'
              }
            }
          ]
        }
      });

      return NextResponse.json({ 
        message: `Se eliminaron ${deleteResult.count} productos temporales y marcadores`,
        deletedCount: deleteResult.count
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error cleaning up temp products:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
