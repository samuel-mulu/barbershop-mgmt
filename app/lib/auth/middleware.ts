// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req: NextRequest) {
  // Check for token in Authorization header first, then cookies
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.cookies.get('token')?.value;
    
  const url = req.nextUrl.clone();

  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const role = decoded.role;

    // Redirect based on role
    if (url.pathname === '/dashboard') {
      if (role === 'admin') url.pathname = '/dashboard/admin';
      else if (role === 'owner') url.pathname = '/dashboard/owner';
      else if (role === 'barber') url.pathname = '/dashboard/barber';
      else if (role === 'washer') url.pathname = '/dashboard/barber'; // Washers use barber dashboard
      else if (role === 'customer') url.pathname = '/dashboard/customer';
      else url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
