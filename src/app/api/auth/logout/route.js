// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada' }, { status: 200 });
  response.cookies.set(AUTH_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}
