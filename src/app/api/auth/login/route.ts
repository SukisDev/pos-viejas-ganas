import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAuthCookieName, signAuthToken, Role } from '../../../../lib/auth';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

interface LoginBody {
  username: string;
  password: string;
}

function isRole(value: string): value is Role {
  return value === 'ADMIN' || value === 'CASHIER' || value === 'CHEF';
}

export async function POST(req: Request) {
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (
    typeof bodyUnknown !== 'object' ||
    bodyUnknown === null ||
    typeof (bodyUnknown as Record<string, unknown>).username !== 'string' ||
    typeof (bodyUnknown as Record<string, unknown>).password !== 'string'
  ) {
    return NextResponse.json({ error: 'username y password son requeridos' }, { status: 400 });
  }

  const { username, password } = bodyUnknown as LoginBody;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { 
      id: true, 
      username: true, 
      role: true, 
      passwordHash: true,
      active: true // Agregar verificación de estado activo
    },
  });

  // Respuesta genérica para no filtrar existencia de usuario
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  // Verificar si el usuario está activo ANTES de verificar la contraseña
  if (!user.active) {
    return NextResponse.json({ error: 'No tienes permisos para acceder al sistema' }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  const roleStr = String(user.role);
  if (!isRole(roleStr)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 500 });
  }

  const token = await signAuthToken({ id: user.id, username: user.username, role: roleStr });

  const res = NextResponse.json({ id: user.id, username: user.username, role: roleStr });
  res.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}
