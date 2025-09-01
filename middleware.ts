import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieName, verifyAuthToken, Role } from './src/lib/auth';

const guards: Array<{ prefix: `/${string}`; roles: ReadonlyArray<Role> }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/cashier', roles: ['ADMIN', 'CASHIER'] },
  { prefix: '/kitchen', roles: ['ADMIN', 'CHEF'] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const guard = guards.find((g) => pathname.startsWith(g.prefix));
  if (!guard) return NextResponse.next();

  const token = req.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const payload = await verifyAuthToken(token);
  if (!payload || !guard.roles.includes(payload.role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*', '/kitchen/:path*'],
};
