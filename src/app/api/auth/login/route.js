// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('Users-InkBlack');

    // 1. Buscar al usuario
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Verificar que esté verificado (que haya pasado por el OTP)
    if (!user.isVerified) {
      return NextResponse.json({ error: 'Debes verificar tu correo primero' }, { status: 403 });
    }

    // 3. Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 4. Generar un Token JWT (válido por 1 día)
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Devolver el token
    return NextResponse.json({ 
      message: 'Login exitoso',
      token,
      user: { username: user.username, email: user.email }
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}