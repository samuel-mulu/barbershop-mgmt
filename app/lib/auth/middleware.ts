// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function middleware(req: NextRequest) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string; _id: string };
    const role = decoded.role;
    const userId = decoded._id;

    // Check user status in database
    try {
      await connectDB();
      const user = await User.findById(userId).select('isActive isSuspended');
      
      if (!user) {
        // User not found in database
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      // Check if user is deactivated or suspended
      if (user.isActive === false) {
        // Clear token and redirect to login with error
        const response = NextResponse.redirect(new URL('/login?error=deactivated', req.url));
        response.cookies.delete('token');
        return response;
      }

      if (user.isSuspended === true) {
        // Clear token and redirect to login with error
        const response = NextResponse.redirect(new URL('/login?error=suspended', req.url));
        response.cookies.delete('token');
        return response;
      }
    } catch (dbError) {
      console.error('Database error in middleware:', dbError);
      // If database check fails, allow access but log the error
    }

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
  } catch {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
