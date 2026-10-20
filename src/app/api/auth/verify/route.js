// src/app/api/auth/verify/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, otpCode } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('Users-InkBlack');

    // 1. Buscar al usuario
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Verificar que el código sea correcto
    if (user.otpCode !== otpCode) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
    }

    // 3. Verificar que no haya expirado
    if (new Date() > new Date(user.otpExpiresAt)) {
      return NextResponse.json({ error: 'El código ha expirado' }, { status: 400 });
    }

    // 4. Actualizar al usuario: verificado y eliminar el OTP
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { isVerified: true },
        $unset: { otpCode: "", otpExpiresAt: "" } // Elimina los campos
      }
    );

    return NextResponse.json({ message: 'Usuario verificado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}   