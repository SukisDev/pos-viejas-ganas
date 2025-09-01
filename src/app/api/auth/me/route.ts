import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthCookieName, verifyAuthToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies(); // <- en Next 15 es async
  const cookie = cookieStore.get(getAuthCookieName());
  if (!cookie) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const payload = await verifyAuthToken(cookie.value);
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

  return NextResponse.json({
    id: payload.sub,
    username: payload.username,
    role: payload.role,
  });
}
