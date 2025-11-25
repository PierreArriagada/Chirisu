/**
 * ========================================
 * API ROUTE: Get Pending 2FA Setup
 * ========================================
 * Ubicación: src/app/api/auth/get-pending-2fa/route.ts
 * 
 * PROPÓSITO:
 * - Recuperar configuración de 2FA pendiente
 * - Para usuarios que cerraron la ventana sin completar setup
 * 
 * FLUJO:
 * 1. Usuario intenta login
 * 2. Sistema detecta has_2fa_setup = false pero existe user_2fa
 * 3. Frontend llama a este endpoint con userId
 * 4. Retorna QR code y códigos para completar setup
 * 
 * CONEXIONES:
 * - BD: app.user_2fa, app.recovery_codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { generateQRCode } from '@/lib/two-factor';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // 1. OBTENER USUARIO
    const userResult = await pool.query(
      `SELECT id, username, email, has_2fa_setup
       FROM app.users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // 2. VERIFICAR QUE TENGA 2FA PENDIENTE
    if (user.has_2fa_setup) {
      return NextResponse.json(
        { error: 'Este usuario ya tiene 2FA configurado' },
        { status: 400 }
      );
    }

    // 3. OBTENER CONFIGURACIÓN DE 2FA
    const twoFactorResult = await pool.query(
      `SELECT secret, backup_codes, enabled, created_at
       FROM app.user_2fa
       WHERE user_id = $1`,
      [userId]
    );

    if (twoFactorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró configuración de 2FA. Registra una cuenta nueva.' },
        { status: 404 }
      );
    }

    const twoFactorData = twoFactorResult.rows[0];

    // Si ya está habilitado, no debería llegar aquí
    if (twoFactorData.enabled) {
      return NextResponse.json(
        { error: 'El 2FA ya está habilitado. Intenta iniciar sesión.' },
        { status: 400 }
      );
    }

    // 4. OBTENER O GENERAR BACKUP CODES
    // El recovery code en texto plano está temporalmente en backup_codes[0]
    const recoveryCodePlain = twoFactorData.backup_codes?.[0] || null;
    
    // Generar nuevos backup codes si no existen o solo está el recovery code
    let backupCodes: string[] = [];
    if (!twoFactorData.backup_codes || twoFactorData.backup_codes.length <= 1) {
      // Generar 8 códigos de backup
      const crypto = require('crypto');
      for (let i = 0; i < 8; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex'));
      }
      
      // Hashear los códigos para guardar en BD
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );
      
      // Actualizar en la BD (mantener el recovery code como primer elemento)
      const allCodes = recoveryCodePlain ? [recoveryCodePlain, ...hashedBackupCodes] : hashedBackupCodes;
      await pool.query(
        `UPDATE app.user_2fa SET backup_codes = $1 WHERE user_id = $2`,
        [allCodes, userId]
      );
    } else {
      // Los códigos ya existen (excepto el primero que es recovery code)
      // Como están hasheados, no podemos mostrarlos, generamos nuevos
      const crypto = require('crypto');
      for (let i = 0; i < 8; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex'));
      }
      
      // Hashear y actualizar
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );
      
      const allCodes = recoveryCodePlain ? [recoveryCodePlain, ...hashedBackupCodes] : hashedBackupCodes;
      await pool.query(
        `UPDATE app.user_2fa SET backup_codes = $1 WHERE user_id = $2`,
        [allCodes, userId]
      );
    }

    // 5. GENERAR QR CODE CON EL SECRET EXISTENTE
    // Crear otpauth URL manualmente
    const otpAuthUrl = `otpauth://totp/Chirisu:${user.email}?secret=${twoFactorData.secret}&issuer=Chirisu`;
    const qrCode = await generateQRCode(otpAuthUrl);

    // 6. RETORNAR DATOS PARA COMPLETAR SETUP
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      twoFactorSetup: {
        qrCode,
        secret: twoFactorData.secret, // Mostrar secret para configuración manual
        recoveryCode: recoveryCodePlain,
        backupCodes: backupCodes, // Códigos de backup en texto plano
        backupCodesAvailable: true, // Ahora sí están disponibles
        message: 'Completa la configuración de 2FA para activar tu cuenta',
      },
      isPending: true,
    }, { status: 200 });

  } catch (error) {
    console.error('Error en get-pending-2fa:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de 2FA' },
      { status: 500 }
    );
  }
}
