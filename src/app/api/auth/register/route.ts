/**
 * ========================================
 * API ROUTE: Register (Crear Cuenta Nueva)
 * ========================================
 * Ubicación: src/app/api/auth/register/route.ts
 * 
 * PROPÓSITO:
 * - Crear nueva cuenta con A2F OBLIGATORIO
 * - Generar secret de A2F automáticamente
 * - Generar código de recuperación único
 * 
 * FLUJO:
 * 1. Recibe: username, email, password
 * 2. Valida que email no exista
 * 3. Hash password con bcrypt
 * 4. Crea usuario en BD
 * 5. Genera secret A2F + QR code + backup codes
 * 6. Guarda en user_2fa (enabled = false hasta verificar)
 * 7. Genera recovery_code único
 * 8. Retorna QR y backup codes (usuario DEBE guardarlos)
 * 9. Usuario escanea QR y verifica código
 * 10. Solo entonces se activa la cuenta
 * 
 * CONEXIONES:
 * - BD: INSERT en users, user_2fa, recovery_codes
 * - lib/two-factor.ts: setup2FA()
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { setup2FA } from '@/lib/two-factor';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar contraseña fuerte
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe incluir mayúsculas, minúsculas y números' },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existingUser = await pool.query(
      'SELECT id FROM app.users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Verificar que el username no exista
    const existingUsername = await pool.query(
      'SELECT id FROM app.users WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está en uso' },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en BD (con has_2fa_setup = false, se activará al verificar)
    const userResult = await pool.query(
      `INSERT INTO app.users (username, email, password_hash, has_2fa_setup, created_at)
       VALUES ($1, $2, $3, false, NOW())
       RETURNING id, username, email`,
      [username, email.toLowerCase(), hashedPassword]
    );

    const newUser = userResult.rows[0];

    // Obtener o crear el rol 'user' (ID 3 por convención)
    const roleResult = await pool.query(
      `SELECT id FROM app.roles WHERE name = 'user'`
    );
    
    let userRoleId = roleResult.rows[0]?.id;
    
    // Si no existe el rol 'user', crearlo
    if (!userRoleId) {
      const createRoleResult = await pool.query(
        `INSERT INTO app.roles (name, display_name, description)
         VALUES ('user', 'Usuario', 'Usuario regular de la plataforma')
         RETURNING id`
      );
      userRoleId = createRoleResult.rows[0].id;
    }

    // Asignar rol 'user' al nuevo usuario
    await pool.query(
      `INSERT INTO app.user_roles (user_id, role_id, assigned_at)
       VALUES ($1, $2, NOW())`,
      [newUser.id, userRoleId]
    );

    // Generar A2F (OBLIGATORIO)
    const twoFactorSetup = await setup2FA(email.toLowerCase(), 'Chirisu');

    // Crear tabla user_2fa si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app.user_2fa (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
        secret VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        backup_codes TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);

    // Guardar configuración de A2F en BD (enabled = false hasta verificar)
    await pool.query(
      `INSERT INTO app.user_2fa (user_id, secret, enabled, backup_codes, created_at)
       VALUES ($1, $2, false, $3, NOW())`,
      [
        newUser.id,
        twoFactorSetup.secret,
        twoFactorSetup.backupCodes, // Ya vienen hasheados
      ]
    );

    // Generar código de recuperación ÚNICO (para recuperar contraseña con A2F)
    const recoveryCode = crypto.randomBytes(32).toString('hex');
    
    // Crear tabla recovery_codes si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app.recovery_codes (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
        code VARCHAR(255) NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        used_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    await pool.query(
      `INSERT INTO app.recovery_codes (user_id, code, created_at)
       VALUES ($1, $2, NOW())`,
      [newUser.id, recoveryCode]
    );

    // Crear listas predeterminadas para el nuevo usuario
    const defaultLists = [
      { name: 'Por Ver', slug: 'por-ver', description: 'Títulos que planeo ver' },
      { name: 'Siguiendo', slug: 'siguiendo', description: 'Títulos que estoy viendo' },
      { name: 'Completado', slug: 'completado', description: 'Títulos que he completado' },
      { name: 'Favoritos', slug: 'favoritos', description: 'Mis títulos favoritos' },
    ];

    // Insertar listas predeterminadas
    for (const list of defaultLists) {
      await pool.query(
        `INSERT INTO app.lists (user_id, name, slug, description, is_default, is_public, created_at)
         VALUES ($1, $2, $3, $4, true, true, NOW())
         ON CONFLICT (user_id, slug) DO NOTHING`,
        [newUser.id, list.name, list.slug, list.description]
      );
    }

    // Retornar datos para que el usuario configure su A2F
    return NextResponse.json(
      {
        message: 'Cuenta creada exitosamente',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
        twoFactorSetup: {
          qrCode: twoFactorSetup.qrCode,
          secret: twoFactorSetup.secret,
          backupCodes: twoFactorSetup.backupCodesPlain, // Sin hashear para mostrar
          recoveryCode, // Código único para recuperación
        },
        nextStep: 'verify-2fa', // Indicar que debe verificar A2F
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    );
  }
}
