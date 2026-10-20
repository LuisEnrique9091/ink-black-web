// src/app/api/auth/session/route.js
import { getSession } from '@/lib/auth';
import { ok, unauthorized } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getSession(request);
  if (!session) return unauthorized();
  return ok({ user: { username: session.username, email: session.email } });
}
