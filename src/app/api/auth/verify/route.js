// src/app/api/auth/verify/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { badRequest, handleError, notFound, ok } from '@/lib/http';
import { isValidEmail, normalizeEmail } from '@/lib/validators';

export const dynamic = 'force-dynamic';

const MAX_INTENTOS = 5;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const otpCode = String(body.otpCode || '').trim();

    if (!isValidEmail(email)) return badRequest('Correo no válido');
    if (!/^\d{6}$/.test(otpCode)) return badRequest('El código debe tener 6 dígitos');

    const usersCollection = await getCollection(COLLECTIONS.usuarios);
    const user = await usersCollection.findOne({ email });

    if (!user) return notFound('Usuario no encontrado');
    if (user.isVerified) return ok({ message: 'Tu correo ya está verificado' });

    if (!user.otpCode) {
      return badRequest('No hay un código activo. Solicita uno nuevo.');
    }

    const intentos = Number(user.otpAttempts) || 0;
    if (intentos >= MAX_INTENTOS) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { otpCode: '', otpExpiresAt: '' }, $set: { otpAttempts: 0 } }
      );
      return badRequest('Demasiados intentos. Solicita un código nuevo.');
    }

    if (user.otpCode !== otpCode) {
      await usersCollection.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
      const restantes = MAX_INTENTOS - (intentos + 1);
      return badRequest(
        restantes > 0
          ? `Código incorrecto. Te quedan ${restantes} intento(s).`
          : 'Código incorrecto. Solicita uno nuevo.'
      );
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { otpCode: '', otpExpiresAt: '' } }
      );
      return badRequest('El código ha expirado. Solicita uno nuevo.');
    }

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true, verifiedAt: new Date() },
        $unset: { otpCode: '', otpExpiresAt: '', otpAttempts: '' },
      }
    );

    return ok({ message: 'Correo verificado correctamente' });
  } catch (err) {
    return handleError(err, 'POST /api/auth/verify');
  }
}
