// src/lib/mailer.js
import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Faltan EMAIL_USER o EMAIL_PASS en las variables de entorno');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export function generarOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiraEn(minutos = 10) {
  return new Date(Date.now() + minutos * 60 * 1000);
}

export async function enviarCodigoVerificacion(email, otpCode) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Ink Black" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Tu código de verificación - Ink Black',
    html: `<div style="font-family:Arial,sans-serif">
             <h2 style="color:#dc2626">Bienvenido a Ink Black</h2>
             <p>Tu código de verificación es:</p>
             <p style="font-size:32px;font-weight:bold;letter-spacing:6px">${otpCode}</p>
             <p>Este código expirará en 10 minutos.</p>
           </div>`,
  });
}
