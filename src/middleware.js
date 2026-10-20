// src/middleware.js
import { NextResponse } from 'next/server';

const AUTH_COOKIE = 'ib_token';

// Rutas que requieren sesión
const PROTEGIDAS = ['/', '/agenda', '/inventario', '/nueva-sesion', '/reportes'];
// Rutas para visitantes (si ya hay sesión se manda al dashboard)
const PUBLICAS = ['/login', '/register'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const tieneToken = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  const esProtegida = PROTEGIDAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
  const esPublica = PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );

  if (esProtegida && !tieneToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (esPublica && tieneToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/agenda/:path*', '/inventario/:path*', '/nueva-sesion/:path*', '/reportes/:path*', '/login', '/register'],
};
