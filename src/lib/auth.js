// src/lib/auth.js
import jwt from 'jsonwebtoken';

export const AUTH_COOKIE = 'ib_token';
export const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 1 día

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta JWT_SECRET en las variables de entorno');
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      username: user.username,
    },
    getSecret(),
    { expiresIn: '1d' }
  );
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

/**
 * Lee el token desde la cookie httpOnly o desde el header Authorization.
 * Devuelve el payload o null.
 */
export function getSession(request) {
  const cookieToken = request?.cookies?.get?.(AUTH_COOKIE)?.value;
  const headerToken = request?.headers
    ?.get?.('authorization')
    ?.replace(/^Bearer\s+/i, '');
  return verifyToken(cookieToken || headerToken);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  };
}
