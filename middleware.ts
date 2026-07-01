import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value;
  const pathname = req.nextUrl.pathname;

  // If already logged in and visiting /login, redirect to /dashboard
  if (pathname === '/login' && session === 'authenticated') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect dashboard, logs, and settings routes
  if (pathname !== '/login' && (!session || session !== 'authenticated')) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard', '/dashboard/:path*',
    '/login'
  ],
};

