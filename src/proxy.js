import { NextResponse } from 'next/server';

export function proxy(request) {
  const path = request.nextUrl.pathname;
  
  // Protect PIM administrative routes based on role cookie
  if (path.startsWith('/admin')) {
    const userRole = request.cookies.get('user-role')?.value || 'ADMIN';

    // 1. Pricing matrix requires ADMIN role
    if (path.startsWith('/admin/pricing') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/catalog?error=unauthorized', request.url));
    }

    // 2. Approval queue requires APPROVER or ADMIN role
    if (path.startsWith('/admin/approvals') && !['APPROVER', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/catalog?error=unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};