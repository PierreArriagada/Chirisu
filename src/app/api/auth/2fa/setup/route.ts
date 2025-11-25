/**
 * ========================================
 * API ROUTE: SETUP 2FA
 * POST /api/auth/2fa/setup
 * ========================================
 * 
 * FLUJO:
 * 1. Verifica autenticación del usuario
 * 2. Genera secreto y códigos de respaldo
 * 3. Genera código QR
 * 4. Retorna datos para configurar 2FA
 * (NO se activa hasta verificar el código)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { setup2FA, hashBackupCodes } from '@/lib/two-factor';
import { db } from '@/lib/database';

// ============================================
// ENDPOINT: POST /api/auth/2fa/setup
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTENTICACIÓN
    const sessionUser = await getSessionUser(request);
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. VERIFICAR SI YA TIENE 2FA ACTIVO
    const existing2FA = await db.query(
      'SELECT enabled FROM user_2fa WHERE user_id = $1',
      [sessionUser.id]
    );

    if (existing2FA.rows.length > 0 && existing2FA.rows[0].enabled) {
      return NextResponse.json(
        { error: '2FA ya está activado. Primero desactívalo.' },
        { status: 400 }
      );
    }

    // 3. GENERAR DATOS DE 2FA
    const { secret, qrCode, backupCodes } = await setup2FA(sessionUser.username);

    // 4. HASH DE CÓDIGOS DE RESPALDO
    const hashedBackupCodes = hashBackupCodes(backupCodes);

    // 5. GUARDAR EN BD (pero sin activar todavía)
    if (existing2FA.rows.length > 0) {
      // Actualizar existente
      await db.query(
        `UPDATE user_2fa 
         SET secret = $1, backup_codes = $2, enabled = false
         WHERE user_id = $3`,
        [secret, hashedBackupCodes, sessionUser.id]
      );
    } else {
      // Crear nuevo
      await db.query(
        `INSERT INTO user_2fa (user_id, secret, backup_codes, enabled)
         VALUES ($1, $2, $3, false)`,
        [sessionUser.id, secret, hashedBackupCodes]
      );
    }

    // 6. RETORNAR DATOS (códigos de respaldo solo se muestran una vez)
    return NextResponse.json({
      secret,
      qrCode,
      backupCodes, // IMPORTANTE: Guardar estos códigos, no se mostrarán de nuevo
    }, { status: 200 });

  } catch (error) {
    console.error('Error en setup 2FA:', error);
    return NextResponse.json(
      { error: 'Error configurando 2FA' },
      { status: 500 }
    );
  }
}
