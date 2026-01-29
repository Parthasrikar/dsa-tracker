import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/problems', '/insights', '/settings', '/friends', '/leaderboard'];
// Public routes containing auth forms (login/register)
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  // Update session expiration if it exists
  await updateSession(request);

  const currentUser = request.cookies.get('session')?.value;
  const path = request.nextUrl.pathname;
  
  // Check if the current path is a protected route
  // We check if the path starts with any of the protected routes, or is exactly '/' which redirects to dashboard usually
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) || path === '/';
  
  // If no session and trying to access protected route, redirect to login
  if (isProtectedRoute && !currentUser) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If session exists and trying to access auth routes, redirect to dashboard
  if (currentUser && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
