/**
 * ========================================
 * TWO-FACTOR AUTHENTICATION (2FA) UTILITIES
 * ========================================
 * Funciones para autenticación de dos factores usando TOTP
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

// ============================================
// CONFIGURACIÓN
// ============================================

const APP_NAME = 'Chirisu';
const ISSUER = 'Chirisu';

// ============================================
// TIPOS
// ============================================

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[]; // Hasheados (para BD)
  backupCodesPlain: string[]; // Sin hashear (para mostrar al usuario)
}

export interface TwoFactorVerification {
  valid: boolean;
  delta?: number;
}

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Genera un nuevo secreto para 2FA
 */
export function generateSecret(username: string, issuer: string = ISSUER): {
  secret: string;
  otpAuthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${username})`,
    issuer: issuer,
    length: 32,
  });

  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url || '',
  };
}

/**
 * Genera códigos de respaldo (backup codes)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generar código de 8 caracteres alfanuméricos
    const code = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase();
    
    // Formato: XXXX-XXXX
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Genera un código QR para configurar 2FA en apps como Google Authenticator
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(otpAuthUrl);
    return qrCode;
  } catch (error) {
    console.error('Error generando QR code:', error);
    throw new Error('No se pudo generar el código QR');
  }
}

/**
 * Configuración completa de 2FA para un usuario
 */
export async function setup2FA(username: string, issuer: string = ISSUER): Promise<TwoFactorSetup> {
  const { secret, otpAuthUrl } = generateSecret(username, issuer);
  const qrCode = await generateQRCode(otpAuthUrl);
  const backupCodesPlain = generateBackupCodes();
  const backupCodes = hashBackupCodes(backupCodesPlain);

  return {
    secret,
    qrCode,
    backupCodes, // Hasheados para BD
    backupCodesPlain, // Sin hashear para mostrar
  };
}

/**
 * Verifica un código TOTP
 */
export function verifyToken(
  secret: string,
  token: string,
  window: number = 1
): TwoFactorVerification {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window, // Permite códigos cercanos en el tiempo
    });

    return {
      valid: Boolean(verified),
    };
  } catch (error) {
    console.error('Error verificando token 2FA:', error);
    return { valid: false };
  }
}

/**
 * Genera un token TOTP actual (útil para testing)
 */
export function generateToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32',
  });
}

/**
 * Verifica si un código de respaldo es válido
 */
export function verifyBackupCode(
  backupCodes: string[],
  code: string
): {
  valid: boolean;
  remainingCodes?: string[];
} {
  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  const index = backupCodes.findIndex(
    (bc) => bc.replace('-', '') === normalizedCode.replace('-', '')
  );

  if (index === -1) {
    return { valid: false };
  }

  // Eliminar el código usado
  const remainingCodes = [
    ...backupCodes.slice(0, index),
    ...backupCodes.slice(index + 1),
  ];

  return {
    valid: true,
    remainingCodes,
  };
}

/**
 * Hash de códigos de respaldo para almacenamiento seguro
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) => {
    const hash = crypto.createHash('sha256');
    hash.update(code);
    return hash.digest('hex');
  });
}

/**
 * Verifica un código de respaldo hasheado
 */
export function verifyHashedBackupCode(
  hashedCodes: string[],
  code: string
): {
  valid: boolean;
  remainingCodes?: string[];
} {
  const hash = crypto.createHash('sha256');
  hash.update(code.toUpperCase().replace(/\s/g, ''));
  const codeHash = hash.digest('hex');

  const index = hashedCodes.findIndex((hc) => hc === codeHash);

  if (index === -1) {
    return { valid: false };
  }

  const remainingCodes = [
    ...hashedCodes.slice(0, index),
    ...hashedCodes.slice(index + 1),
  ];

  return {
    valid: true,
    remainingCodes,
  };
}
