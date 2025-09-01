import { NextResponse } from 'next/server';
import { getAuthCookieName } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const name = getAuthCookieName();

  const res = NextResponse.json({ ok: true });

  res.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  try {
    // @ts-expect-error: algunos tipos antiguos no exponen delete, pero en runtime exist
    res.cookies.delete(name, { path: '/' });
  } catch {
  }

  return res;
}
