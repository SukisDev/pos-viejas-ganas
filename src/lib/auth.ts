import { jwtVerify, SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';

export type Role = 'ADMIN' | 'CASHIER' | 'CHEF';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

const encoder = new TextEncoder();
const prisma = new PrismaClient();

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error('Falta AUTH_JWT_SECRET en variables de entorno');
  return encoder.encode(secret);
}

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE_NAME ?? 'vg_session';
}

export async function signAuthToken(user: {
  id: string;
  username: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role;
    if (role !== 'ADMIN' && role !== 'CASHIER' && role !== 'CHEF') return null;
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    const username = typeof payload.username === 'string' ? payload.username : undefined;
    if (!sub || !username) return null;

    // VERIFICACIÓN CRÍTICA: Comprobar que el usuario sigue activo en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { 
        id: true, 
        active: true, 
        role: true,
        // deleted: true // Comentado hasta que se aplique la migración
      }
    });

    // Si el usuario no existe, está inactivo o eliminado, invalidar el token
    if (!user || !user.active) {
      return null;
    }

    // También verificar que el rol no haya cambiado
    if (user.role !== role) {
      return null;
    }

    return { sub, username, role, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}
