/**
 * ========================================
 * API ROUTE: Recover Password with 2FA
 * ========================================
 * Ubicación: src/app/api/auth/recover-password/route.ts
 * 
 * PROPÓSITO:
 * - Recuperar contraseña usando RECOVERY CODE + A2F
 * - NO usa email (hasta tener correo empresarial)
 * 
 * FLUJO:
 * 1. Usuario ingresa su RECOVERY CODE único
 * 2. Sistema busca usuario asociado
 * 3. Usuario verifica con código A2F
 * 4. Si válido, permite cambiar contraseña
 * 
 * REQUISITOS:
 * - Recovery code (64 caracteres hex)
 * - Código A2F (6 dígitos o backup code)
 * - Nueva contraseña
 * 
 * CONEXIONES:
 * - BD: app.recovery_codes, app.user_2fa, app.users
 * - lib/two-factor.ts: verifyToken()
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken, verifyHashedBackupCode } from '@/lib/two-factor';
import bcrypt from 'bcryptjs';

// ============================================
// TIPOS
// ============================================

interface RecoverPasswordBody {
  recoveryCode: string;
  twoFactorCode: string;
  newPassword: string;
}

// ============================================
// ENDPOINT: POST /api/auth/recover-password
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: RecoverPasswordBody = await request.json();
    const { recoveryCode, twoFactorCode, newPassword } = body;

    // 1. VALIDACIONES BÁSICAS
    if (!recoveryCode || !twoFactorCode || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de recovery code
    if (recoveryCode.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryCode)) {
      return NextResponse.json(
        { error: 'Recovery code inválido' },
        { status: 400 }
      );
    }

    // Validar contraseña nueva
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'La contraseña debe incluir mayúsculas, minúsculas y números' },
        { status: 400 }
      );
    }

    // 2. BUSCAR USUARIO POR RECOVERY CODE
    // Usar la tabla app.recovery_codes (estructura actualizada)
    const recoveryResult = await pool.query(
      `SELECT rc.user_id, u.email, u.username, u.is_active, u.deleted_at
       FROM app.recovery_codes rc
       JOIN app.users u ON u.id = rc.user_id
       WHERE rc.code = $1`,
      [recoveryCode]
    );

    if (recoveryResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recovery code no encontrado o inválido' },
        { status: 404 }
      );
    }

    const { user_id, email, username, is_active, deleted_at } = recoveryResult.rows[0];

    // Verificar que el usuario esté activo
    if (!is_active || deleted_at !== null) {
      return NextResponse.json(
        { error: 'Esta cuenta está desactivada' },
        { status: 403 }
      );
    }

    // 3. VERIFICAR QUE EL USUARIO TENGA A2F ACTIVO
    const twoFactorResult = await pool.query(
      `SELECT secret, enabled, backup_codes
       FROM app.user_2fa
       WHERE user_id = $1`,
      [user_id]
    );

    if (twoFactorResult.rows.length === 0 || !twoFactorResult.rows[0].enabled) {
      return NextResponse.json(
        { error: 'Este usuario no tiene A2F configurado' },
        { status: 400 }
      );
    }

    const { secret, backup_codes } = twoFactorResult.rows[0];

    // 4. VERIFICAR CÓDIGO A2F (TOTP o Backup Code)
    let verification = { valid: false };
    let usedBackupCode = false;
    let backupCodeUsed: string | null = null;

    // Intentar primero como código TOTP (6 dígitos numéricos)
    if (twoFactorCode.length === 6 && /^\d{6}$/.test(twoFactorCode)) {
      verification = verifyToken(secret, twoFactorCode);
    }

    // Si no es válido como TOTP, intentar como backup code
    if (!verification.valid && backup_codes && backup_codes.length > 0) {
      // Nota: backup_codes en BD es un array de strings hasheados con SHA256
      const backupVerification = verifyHashedBackupCode(backup_codes, twoFactorCode);
      verification.valid = backupVerification.valid;
      
      if (backupVerification.valid && backupVerification.remainingCodes) {
        // Actualizar códigos de respaldo (eliminar el usado)
        await pool.query(
          'UPDATE app.user_2fa SET backup_codes = $1 WHERE user_id = $2',
          [backupVerification.remainingCodes, user_id]
        );
        usedBackupCode = true;
        backupCodeUsed = twoFactorCode;
        
        // Log para debug
        console.log(`[Recovery] Usuario ${username} usó backup code. Códigos restantes: ${backupVerification.remainingCodes.length}`);
      }
    }

    if (!verification.valid) {
      return NextResponse.json(
        { 
          error: 'Código A2F o código de respaldo inválido',
          hint: 'Verifica que estés usando el código correcto de tu app autenticadora o un código de respaldo válido'
        },
        { status: 401 }
      );
    }

    // ✅ CÓDIGO VÁLIDO - PROCEDER A CAMBIAR CONTRASEÑA

    // 5. HASH DE LA NUEVA CONTRASEÑA
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. ACTUALIZAR CONTRASEÑA EN BD
    await pool.query(
      `UPDATE app.users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user_id]
    );

    // 7. REGENERAR RECOVERY CODE (por seguridad)
    const crypto = require('crypto');
    const newRecoveryCode = crypto.randomBytes(32).toString('hex'); // 64 caracteres hex

    await pool.query(
      `UPDATE app.recovery_codes
       SET code = $1, last_regenerated = NOW()
       WHERE user_id = $2`,
      [newRecoveryCode, user_id]
    );

    // 8. SI SE USÓ BACKUP CODE, notificar cuántos quedan
    let backupCodesRemaining = 0;
    if (usedBackupCode) {
      const updatedBackupResult = await pool.query(
        'SELECT backup_codes FROM app.user_2fa WHERE user_id = $1',
        [user_id]
      );
      backupCodesRemaining = updatedBackupResult.rows[0]?.backup_codes?.length || 0;
    }

    // 9. REGISTRAR EN AUDIT LOG (si existe la tabla)
    try {
      await pool.query(
        `INSERT INTO app.audit_log (user_id, action, resource_type, details)
         VALUES ($1, 'password_reset', 'auth', $2)`,
        [
          user_id,
          JSON.stringify({
            method: usedBackupCode ? 'backup_code' : '2fa_totp',
            timestamp: new Date().toISOString(),
            backup_codes_remaining: usedBackupCode ? backupCodesRemaining : undefined
          })
        ]
      );
    } catch (error) {
      // Ignorar error de audit log si no existe la tabla
      console.warn('[Recovery] Audit log not available:', error);
    }

    // 10. RETORNAR ÉXITO CON NUEVO RECOVERY CODE
    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      newRecoveryCode, // ⚠️ IMPORTANTE: Guardar este nuevo código
      username,
      email,
      usedBackupCode, // Indica si se usó un código de respaldo
      backupCodesRemaining: usedBackupCode ? backupCodesRemaining : undefined,
    }, { status: 200 });

  } catch (error) {
    console.error('Error en recover-password:', error);
    return NextResponse.json(
      { error: 'Error al recuperar contraseña' },
      { status: 500 }
    );
  }
}
