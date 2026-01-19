import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Protect dashboard and course routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/course')) {
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect admin routes - only admins can access (except signin page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/signin') {
    // Admin routes use cookie-based auth, check for admin-token
    const adminToken = request.cookies.get('admin-token');
    if (!adminToken) {
      const adminSignInUrl = new URL('/admin/signin', request.url);
      return NextResponse.redirect(adminSignInUrl);
    }
  }

  // Student routes are now publicly accessible (no authentication required)

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/course/:path*', '/admin/:path*'],
};
