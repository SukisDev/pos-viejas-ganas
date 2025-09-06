import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

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
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            ordersCreated: true,
            ordersCompleted: true
          }
        }
      }
    });

    const result = users.map(user => ({
      ...user,
      totalOrders: user._count.ordersCreated + user._count.ordersCompleted,
      cashierOrders: user._count.ordersCreated,
      chefOrders: user._count.ordersCompleted,
      isActive: user.active
    }));

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { username, name, password, role }: { 
      username: string; 
      name: string; 
      password: string; 
      role: string; 
    } = await request.json();

    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: 'username, name, password y role requeridos' }, { status: 400 });
    }

    if (!['ADMIN', 'CASHIER', 'CHEF'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase().trim()
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: hashedPassword,
        role: role as 'ADMIN' | 'CASHIER' | 'CHEF',
        active: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    const result = {
      ...user,
      isActive: user.active
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { userId, username, name, password, role, isActive }: {
      userId: string;
      username?: string;
      name?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const updateData: Record<string, string | boolean> = {};
    
    if (username !== undefined) updateData.username = username.toLowerCase().trim();
    if (name !== undefined) updateData.name = name.trim();
    if (role !== undefined) {
      if (!['ADMIN', 'CASHIER', 'CHEF'].includes(role)) {
        return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.active = isActive;
    
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Al menos un campo para actualizar' }, { status: 400 });
    }

    // Verificar si existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar username duplicado si se actualiza
    if (updateData.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          username: updateData.username as string,
          id: { not: userId }
        }
      });

      if (duplicate) {
        return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    const result = {
      ...updatedUser,
      isActive: updatedUser.active
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { userId }: { userId: string } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    // No permitir eliminar al propio usuario admin
    if (userId === auth.userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 409 });
    }

    // Verificar si el usuario tiene pedidos asociados
    const ordersCount = await prisma.order.count({
      where: {
        OR: [
          { cashierId: userId },
          { chefId: userId }
        ]
      }
    });

    if (ordersCount > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. El usuario tiene ${ordersCount} pedidos asociados. Desactívalo en su lugar.` 
      }, { status: 409 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
