// src/app/api/auth/resend/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { badRequest, handleError, notFound, ok, serverError, tooManyRequests } from '@/lib/http';
import { enviarCodigoVerificacion, generarOtp, otpExpiraEn } from '@/lib/mailer';
import { isValidEmail, normalizeEmail } from '@/lib/validators';

export const dynamic = 'force-dynamic';

const ESPERA_SEGUNDOS = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);

    if (!isValidEmail(email)) return badRequest('Correo no válido');

    const usersCollection = await getCollection(COLLECTIONS.usuarios);
    const user = await usersCollection.findOne({ email });

    if (!user) return notFound('Usuario no encontrado');
    if (user.isVerified) return badRequest('Tu correo ya está verificado, puedes iniciar sesión');

    if (user.otpSentAt) {
      const transcurrido = (Date.now() - new Date(user.otpSentAt).getTime()) / 1000;
      if (transcurrido < ESPERA_SEGUNDOS) {
        const restante = Math.ceil(ESPERA_SEGUNDOS - transcurrido);
        return tooManyRequests(
          `Espera ${restante} segundo(s) antes de solicitar otro código.`
        );
      }
    }

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
      console.error('[RESEND] Error enviando correo:', mailError.message);
      return serverError('No pudimos enviar el correo. Intenta de nuevo en unos minutos.');
    }

    return ok({ message: 'Te enviamos un código nuevo. Revisa tu correo.' });
  } catch (err) {
    return handleError(err, 'POST /api/auth/resend');
  }
}
