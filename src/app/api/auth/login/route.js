// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { AUTH_COOKIE, cookieOptions, signToken } from '@/lib/auth';
import { badRequest, handleError, unauthorized } from '@/lib/http';
import { enviarCodigoVerificacion, generarOtp, otpExpiraEn } from '@/lib/mailer';
import { isValidEmail, normalizeEmail } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');

    if (!isValidEmail(email) || !password) {
      return badRequest('Ingresa un correo y una contraseña válidos');
    }

    const usersCollection = await getCollection(COLLECTIONS.usuarios);
    const user = await usersCollection.findOne({ email });

    if (!user) return unauthorized('Credenciales inválidas');

    const bcrypt = (await import('bcryptjs')).default;
    const passwordValida = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordValida) return unauthorized('Credenciales inválidas');

    // Cuenta sin verificar: reenviamos un código nuevo (máximo uno por minuto).
    if (!user.isVerified) {
      const ultimoEnvio = user.otpSentAt ? new Date(user.otpSentAt).getTime() : 0;
      const puedeReenviar = Date.now() - ultimoEnvio > 60 * 1000;

      if (puedeReenviar) {
        const otpCode = generarOtp();
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              otpCode,
              otpExpiresAt: otpExpiraEn(),
              otpAttempts: 0,
              otpSentAt: new Date(),
            },
          }
        );

        try {
          await enviarCodigoVerificacion(email, otpCode);
        } catch (mailError) {
          console.error('[LOGIN] No se pudo enviar el código:', mailError.message);
          return NextResponse.json(
            { error: 'No pudimos enviar el correo de verificación. Intenta de nuevo en unos minutos.' },
            { status: 503 }
          );
        }
      }

      return NextResponse.json(
        {
          error: puedeReenviar
            ? 'Debes verificar tu correo. Te enviamos un código nuevo.'
            : 'Debes verificar tu correo. Revisa el código que te enviamos hace un momento.',
          requiereVerificacion: true,
        },
        { status: 403 }
      );
    }

    const token = signToken(user);
    const response = NextResponse.json(
      {
        message: 'Login exitoso',
        user: { username: user.username, email: user.email },
      },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE, token, cookieOptions());
    return response;
  } catch (err) {
    return handleError(err, 'POST /api/auth/login');
  }
}
