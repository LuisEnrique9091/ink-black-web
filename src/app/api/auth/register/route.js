// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, username, password } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('Users-InkBlack'); // Ojo: tu colección se llama Users-InkBlack según la captura

    // 1. Verificar si el usuario ya existe
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 });
    }

    // 2. Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generar el código OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Crear el usuario
    await usersCollection.insertOne({
      email,
      username,
      hashedPassword,
      isVerified: false,
      otpCode,
      otpExpiresAt,
      createdAt: new Date(),
    });

    // 5. Enviar el correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Ink Black" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tu código de verificación - Ink Black',
      html: `<h2>Bienvenido a Ink Black</h2>
             <p>Tu código de verificación es: <strong>${otpCode}</strong></p>
             <p>Este código expirará en 10 minutos.</p>`,
    });

    return NextResponse.json({ message: 'Usuario registrado. Revisa tu correo.' }, { status: 201 });

  } catch (error) {
    console.error('ERROR EN REGISTER:', error); // Esto nos dirá qué falla
    return NextResponse.json({ error: 'Error en el servidor: ' + error.message }, { status: 500 });
  }
}