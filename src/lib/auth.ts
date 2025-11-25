/**
 * ========================================
 * HELPERS DE AUTENTICACIÓN (SERVER-ONLY)
 * ========================================
 * 
 * Este archivo contiene funciones para:
 * 1. Hashear passwords con bcrypt
 * 2. Comparar passwords
 * 3. Generar tokens JWT
 * 4. Verificar tokens JWT
 * 
 * ⚠️ SOLO USAR EN EL SERVIDOR (API routes)
 */

import 'server-only';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

// Secret para firmar JWTs (desde .env.local)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-this';

// Nombre de la cookie de sesión
const SESSION_COOKIE_NAME = 'chirisu_session';

// Duración del token (7 días)
const TOKEN_EXPIRATION = '7d';

// ============================================
// TIPOS
// ============================================

export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  isAdmin: boolean;
  isModerator: boolean;
  roles?: string[]; // Array de nombres de roles
}

export interface SessionUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
  roles?: string[]; // Array de nombres de roles
  level?: number;
  points?: number;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
}

// ============================================
// FUNCIONES DE PASSWORD
// ============================================

/**
 * Hashea un password usando bcrypt
 * 
 * @param password - Password en texto plano
 * @returns Hash bcrypt del password
 * 
 * @example
 * const hash = await hashPassword('mySecretPassword');
 * // Guarda `hash` en la base de datos (nunca el password original)
 */
export async function hashPassword(password: string): Promise<string> {
  // Costo 10 = buen balance entre seguridad y velocidad
  return bcrypt.hash(password, 10);
}

/**
 * Compara un password con su hash
 * 
 * @param password - Password en texto plano
 * @param hash - Hash almacenado en la base de datos
 * @returns true si coinciden, false si no
 * 
 * @example
 * const isValid = await verifyPassword('userInput', storedHash);
 * if (isValid) {
 *   // Password correcto
 * }
 */
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// FUNCIONES DE JWT
// ============================================

/**
 * Genera un token JWT con los datos del usuario
 * 
 * @param payload - Datos del usuario a incluir en el token
 * @returns Token JWT firmado
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });
}

/**
 * Verifica y decodifica un token JWT
 * 
 * @param token - Token JWT a verificar
 * @returns Payload decodificado o null si es inválido
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    // Token inválido o expirado
    return null;
  }
}

// ============================================
// FUNCIONES DE COOKIES (SERVER COMPONENTS)
// ============================================

/**
 * Establece la cookie de sesión (SERVER-ONLY)
 * Solo funciona en API routes o Server Actions
 * 
 * @param token - Token JWT a guardar
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,      // No accesible desde JavaScript del cliente
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'lax',     // Protección CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
    path: '/',           // Disponible en toda la app
  });
}

/**
 * Obtiene el token de la cookie de sesión (SERVER-ONLY)
 * 
 * @returns Token JWT o null si no existe
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Elimina la cookie de sesión (logout)
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Obtiene el usuario actual desde la cookie de sesión
 * 
 * @returns Usuario autenticado o null si no hay sesión
 */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Obtiene el usuario de la sesión actual desde el request
 */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  try {
    // Intentar obtener cookie desde headers
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    // Parsear cookies manualmente
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    
    if (!sessionCookie) return null;

    const token = sessionCookie.split('=')[1];
    if (!token) return null;

    // Verificar token y extraer payload
    const payload = verifyToken(token);
    if (!payload) return null;

    // Convertir JwtPayload a SessionUser
    return {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      displayName: payload.username, // Temporal, se puede mejorar
      avatarUrl: null,
      isAdmin: payload.isAdmin,
      isModerator: payload.isModerator,
      roles: payload.roles,
      level: 1, // Valores por defecto
      points: 0,
    };
  } catch (error) {
    console.error('Error obteniendo usuario de sesión:', error);
    return null;
  }
}

// ============================================
// HELPERS DE VALIDACIÓN
// ============================================

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida fortaleza de password
 * Mínimo 8 caracteres
 */
export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}
