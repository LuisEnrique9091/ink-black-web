// src/app/api/auth/register/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { badRequest, created, handleError } from '@/lib/http';
import { enviarCodigoVerificacion, generarOtp, otpExpiraEn } from '@/lib/mailer';
import { isNonEmptyString, isValidEmail, isValidPassword, normalizeEmail } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!isNonEmptyString(username)) return badRequest('El nombre de usuario es obligatorio');
    if (!isValidEmail(email)) return badRequest('El correo electrónico no es válido');
    if (!isValidPassword(password)) return badRequest('La contraseña debe tener al menos 8 caracteres');

    const usersCollection = await getCollection(COLLECTIONS.usuarios);

    const existente = await usersCollection.findOne({ email });
    if (existente) {
      if (existente.isVerified) return badRequest('El correo ya está registrado');
      // Cuenta sin verificar: reenviamos un código nuevo en vez de bloquear el registro.
      const otpCode = generarOtp();
      await usersCollection.updateOne(
        { _id: existente._id },
        {
          $set: {
            username,
            hashedPassword: await hashPassword(password),
            otpCode,
            otpExpiresAt: otpExpiraEn(),
            otpAttempts: 0,
            otpSentAt: new Date(),
          },
        }
      );
      await enviarCodigoVerificacion(email, otpCode);
      return created({ message: 'Tu cuenta ya existía sin verificar. Te enviamos un código nuevo.' });
    }

    const otpCode = generarOtp();
    const resultado = await usersCollection.insertOne({
      email,
      username,
      hashedPassword: await hashPassword(password),
      isVerified: false,
      otpCode,
      otpExpiresAt: otpExpiraEn(),
      otpAttempts: 0,
      otpSentAt: new Date(),
      createdAt: new Date(),
    });

    try {
      await enviarCodigoVerificacion(email, otpCode);
    } catch (mailError) {
      // Sin correo enviado la cuenta quedaría inutilizable: se revierte el registro.
      console.error('[REGISTER] Error enviando correo:', mailError.message);
      await usersCollection.deleteOne({ _id: resultado.insertedId });
      return badRequest(
        'No pudimos enviar el correo de verificación. Revisa la configuración de correo e intenta de nuevo.'
      );
    }

    return created({ message: 'Usuario registrado. Revisa tu correo.' });
  } catch (err) {
    return handleError(err, 'POST /api/auth/register');
  }
}

async function hashPassword(password) {
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.hash(password, 10);
}
