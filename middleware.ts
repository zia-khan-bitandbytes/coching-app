import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest, UserRole } from './lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth', 
    '/customer-signup',
    '/api/auth/login', 
    '/api/auth/signup', 
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ]
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get user from cookies (Edge Runtime compatible)
  const user = await getUserFromRequest(request)

  // If no user, redirect to auth page
  if (!user) {
    const authUrl = new URL('/auth', request.url)
    return NextResponse.redirect(authUrl)
  }

  // Role-based access control
  const canAccess = checkRouteAccess(pathname, user.role)
  
  if (!canAccess) {
    // Redirect to dashboard if user doesn't have access
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

function checkRouteAccess(pathname: string, userRole: UserRole): boolean {
  // Super admin has access to everything
  if (userRole === 'super_admin') {
    return true
  }

  // Admin routes - only super_admin can access
  if (pathname.startsWith('/admin')) {
    return false // Only super_admin can access, and we already checked that above
  }

  // Coach routes - coach and super_admin can access
  if (pathname.startsWith('/coach')) {
    return userRole === 'coach'
  }

  // Customer routes - all authenticated users can access
  if (pathname.startsWith('/customer')) {
    return true
  }

  // Dashboard - all authenticated users can access
  if (pathname === '/dashboard') {
    return true
  }

  // API routes
  if (pathname.startsWith('/api')) {
    // Admin API routes
    if (pathname.startsWith('/api/admin')) {
      return false // Only super_admin can access, and we already checked that above
    }
    
    // Coach API routes
    if (pathname.startsWith('/api/coach')) {
      return userRole === 'coach'
    }
    
    // Customer API routes
    if (pathname.startsWith('/api/customer')) {
      return true
    }
  }

  // Default to allowing access
  return true
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 