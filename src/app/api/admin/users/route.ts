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
    const requestBody = await request.json();
    console.log('PATCH request body recibido:', requestBody);
    
    const { userId, username, name, password, role, isActive }: {
      userId: string;
      username?: string;
      name?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    } = requestBody;

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const updateData: Record<string, string | boolean | null> = {};
    
    console.log('Valores recibidos:', { userId, username, name, password, role, isActive });
    
    if (username !== undefined) {
      const trimmedUsername = username?.trim();
      if (!trimmedUsername) {
        return NextResponse.json({ error: 'El nombre de usuario no puede estar vacío' }, { status: 400 });
      }
      updateData.username = trimmedUsername.toLowerCase();
    }
    if (name !== undefined) updateData.name = name?.trim() || null;
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

    console.log('updateData construido:', updateData);

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

    // Verificar si existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: userId
        // deleted: false // Comentado hasta que se aplique la migración
      },
      include: {
        _count: {
          select: {
            ordersCreated: true,
            ordersCompleted: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const totalOrders = existingUser._count.ordersCreated + existingUser._count.ordersCompleted;

    // Por ahora usamos eliminación física hasta que se aplique la migración soft delete
    // TODO: Cambiar a soft delete cuando se aplique la migración
    try {
      await prisma.user.delete({
        where: { id: userId }
      });
    } catch (error) {
      // Si falla por integridad referencial, desactivar el usuario en su lugar
      console.log('Error eliminando usuario, desactivando en su lugar:', error);
      await prisma.user.update({
        where: { id: userId },
        data: {
          active: false,
          username: `_DELETED_${existingUser.username}_${Date.now()}`
        }
      });
      
      return NextResponse.json({ 
        message: 'Usuario desactivado (tenía registros asociados)',
        preservedOrders: totalOrders,
        username: existingUser.username,
        note: 'Los registros históricos del usuario se mantienen. El usuario fue desactivado en lugar de eliminado.'
      });
    }

    return NextResponse.json({ 
      message: 'Usuario eliminado exitosamente',
      preservedOrders: totalOrders,
      username: existingUser.username,
      note: 'Los registros históricos se mantienen para auditoría'
    });

  } catch (error: unknown) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
