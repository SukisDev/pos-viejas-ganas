import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieName, verifyAuthToken, Role } from './src/lib/auth';

const guards: Array<{ prefix: `/${string}`; roles: ReadonlyArray<Role> }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/cashier', roles: ['ADMIN', 'CASHIER'] },
  { prefix: '/kitchen', roles: ['ADMIN', 'CHEF'] },
];

export async function middleware(req: NextRequest) {
  // Temporalmente comentado para testing del calendario
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*', '/kitchen/:path*'],
};
