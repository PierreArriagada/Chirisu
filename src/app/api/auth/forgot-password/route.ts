/**
 * ========================================
 * API ROUTE: FORGOT PASSWORD
 * POST /api/auth/forgot-password
 * ========================================
 * 
 * FLUJO:
 * 1. Recibe email del usuario
 * 2. Busca usuario en PostgreSQL
 * 3. Genera token único
 * 4. Guarda token en BD con expiración (1 hora)
 * 5. Envía email con enlace de recuperación
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// ============================================
// TIPOS
// ============================================

interface ForgotPasswordBody {
  email: string;
}

// ============================================
// ENDPOINT: POST /api/auth/forgot-password
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 0. RATE LIMITING: Prevenir spam
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 3, // 3 intentos
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Inténtalo más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // 1. PARSEAR REQUEST BODY
    const body: ForgotPasswordBody = await request.json();
    const { email } = body;

    // Validación básica
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // 2. BUSCAR USUARIO
    const userQuery = await db.query(
      'SELECT id, email, username FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email]
    );

    // IMPORTANTE: Por seguridad, siempre retornar el mismo mensaje
    // incluso si el usuario no existe (prevenir enumeración de usuarios)
    const standardMessage = {
      message: 'Si el email existe, recibirás un enlace de recuperación en tu bandeja de entrada.',
    };

    if (userQuery.rows.length === 0) {
      // Usuario no existe, pero retornar mensaje exitoso
      return NextResponse.json(standardMessage, { status: 200 });
    }

    const user = userQuery.rows[0];

    // 3. GENERAR TOKEN ÚNICO
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // 4. GUARDAR TOKEN EN BD
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // 5. ENVIAR EMAIL
    const emailSent = await sendPasswordResetEmail(
      user.email,
      token,
      user.username
    );

    if (!emailSent) {
      console.error('Error enviando email de recuperación');
      // No revelar error al cliente por seguridad
    }

    return NextResponse.json(standardMessage, { status: 200 });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
