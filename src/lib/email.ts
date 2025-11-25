/**
 * ========================================
 * EMAIL UTILITIES
 * ========================================
 * Funciones para enviar emails usando Nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ============================================
// CONFIGURACIÓN
// ============================================

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@chirisu.com';
const FROM_NAME = process.env.FROM_NAME || 'Chirisu';

// ============================================
// TRANSPORTER
// ============================================

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true para puerto 465, false para otros
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ============================================
// TIPOS
// ============================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Envía un email genérico
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    });

    console.log(`Email enviado a ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

/**
 * Envía email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #6366f1;
        }
        .button {
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦊 Chirisu</div>
        </div>
        
        <h2>Recuperación de Contraseña</h2>
        
        <p>Hola <strong>${username}</strong>,</p>
        
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
        </div>
        
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
        
        <div class="warning">
          <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá sin cambios.
        </div>
        
        <div class="footer">
          <p>Este es un email automático, por favor no respondas.</p>
          <p>&copy; ${new Date().getFullYear()} Chirisu. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hola ${username},
    
    Recibimos una solicitud para restablecer tu contraseña.
    
    Haz clic en el siguiente enlace para crear una nueva contraseña:
    ${resetUrl}
    
    Este enlace expirará en 1 hora.
    
    Si no solicitaste este cambio, ignora este email.
    
    Chirisu Team
  `;

  return await sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - Chirisu',
    html,
    text,
  });
}

/**
 * Envía email de verificación de cuenta
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #6366f1;
        }
        .button {
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦊 Chirisu</div>
        </div>
        
        <h2>¡Bienvenido a Chirisu!</h2>
        
        <p>Hola <strong>${username}</strong>,</p>
        
        <p>Gracias por registrarte. Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de email:</p>
        
        <div style="text-align: center;">
          <a href="${verifyUrl}" class="button">Verificar Email</a>
        </div>
        
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #6366f1;">${verifyUrl}</p>
        
        <div class="footer">
          <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
          <p>&copy; ${new Date().getFullYear()} Chirisu. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Verifica tu cuenta - Chirisu',
    html,
  });
}

/**
 * Envía email de confirmación de cambio de contraseña
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #6366f1;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .success {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 12px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦊 Chirisu</div>
        </div>
        
        <h2>Contraseña Cambiada</h2>
        
        <p>Hola <strong>${username}</strong>,</p>
        
        <div class="success">
          ✅ Tu contraseña ha sido cambiada exitosamente.
        </div>
        
        <p>Si no realizaste este cambio, por favor contacta con soporte inmediatamente.</p>
        
        <div class="footer">
          <p>Este es un email automático, por favor no respondas.</p>
          <p>&copy; ${new Date().getFullYear()} Chirisu. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Contraseña Cambiada - Chirisu',
    html,
  });
}
