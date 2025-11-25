/**
 * ========================================
 * API ROUTE: LOGIN CON A2F OBLIGATORIO
 * POST /api/auth/login
 * ========================================
 * 
 * FLUJO ACTUALIZADO:
 * 1. Recibe email y password del cliente
 * 2. Busca usuario en PostgreSQL (schema: app)
 * 3. Verifica password con bcrypt
 * 4. **NUEVO**: Verifica si tiene A2F configurado
 * 5. Si tiene A2F:
 *    - NO genera sesión JWT completa
 *    - Retorna { requires2FA: true, userId }
 *    - Frontend muestra TwoFactorVerifyDialog
 * 6. Si NO tiene A2F (usuarios antiguos):
 *    - Forzar configuración de A2F
 *    - Retornar { requiresSetup2FA: true }
 * 7. Después de verificar A2F en otro endpoint:
 *    - Genera token JWT
 *    - Establece cookie HTTP-only
 *    - Retorna datos del usuario
 * 
 * CONEXIONES:
 * - BD: app.users, app.user_2fa, app.user_roles, app.roles
 * - Siguiente paso: POST /api/auth/2fa/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { 
  verifyPassword, 
  generateToken, 
  isValidEmail 
} from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import type { SessionUser } from '@/lib/auth';

// ============================================
// TIPOS
// ============================================

interface LoginRequestBody {
  email: string;
  password: string;
}

interface UserRow {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  has_2fa_setup: boolean; // ✅ NUEVO: Indica si tiene A2F configurado
  roles: any; // JSON de roles
  level: number;
  points: number;
}

interface Role {
  id: number;
  name: 'admin' | 'moderator' | 'user';
  display_name: string;
}

// ============================================
// ENDPOINT: POST /api/auth/login
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 0. RATE LIMITING: Prevenir ataques de fuerza bruta
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // 5 intentos
    });

    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime);
      return NextResponse.json(
        { 
          error: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // 1. PARSEAR Y VALIDAR REQUEST BODY
    const body: LoginRequestBody = await request.json();
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // 2. BUSCAR USUARIO EN LA BASE DE DATOS CON SUS ROLES (schema: app)
    const result = await pool.query<UserRow>(
      `SELECT 
        u.id, 
        u.email, 
        u.username, 
        u.password_hash, 
        u.display_name, 
        u.avatar_url,
        u.is_active,
        u.level,
        u.points,
        u.has_2fa_setup,
        COALESCE(json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'display_name', r.display_name
          )
        ) FILTER (WHERE r.id IS NOT NULL), '[]') as roles
       FROM app.users u
       LEFT JOIN app.user_roles ur ON u.id = ur.user_id
       LEFT JOIN app.roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email.toLowerCase()]
    );

    // Usuario no encontrado
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Usuario inactivo
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido desactivada' },
        { status: 403 }
      );
    }

    // 3. VERIFICAR PASSWORD
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      // IMPORTANTE: Mismo mensaje que "usuario no encontrado" 
      // para no revelar si el email existe
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // 4. PROCESAR ROLES
    const roles: Role[] = typeof user.roles === 'string' 
      ? JSON.parse(user.roles) 
      : (Array.isArray(user.roles) ? user.roles : []);
    
    const isAdmin = roles.some(r => r.name === 'admin');
    const isModerator = roles.some(r => r.name === 'moderator');

    // ============================================
    // 5. VERIFICAR A2F (OBLIGATORIO)
    // ============================================

    // Si el usuario NO tiene A2F configurado pero lo intentó configurar
    if (!user.has_2fa_setup) {
      // Verificar si existe configuración de 2FA pendiente
      const pendingTwoFactorResult = await pool.query(
        'SELECT id FROM app.user_2fa WHERE user_id = $1',
        [user.id]
      );

      // Si existe configuración pendiente, necesita completar el setup
      if (pendingTwoFactorResult.rows.length > 0) {
        return NextResponse.json({
          requiresSetup2FA: true,
          userId: user.id,
          username: user.username,
          email: user.email,
          hasPendingSetup: true,
          message: 'Debes completar la configuración de 2FA para continuar. Redirigiendo...',
        }, { status: 200 });
      }

      // Si NO existe configuración, crear una nueva para usuario antiguo
      const speakeasy = require('speakeasy');
      const QRCode = require('qrcode');
      const crypto = require('crypto');

      // Generar secret para 2FA
      const secret = speakeasy.generateSecret({
        name: `Chirisu (${user.username})`,
        issuer: 'Chirisu',
        length: 32,
      });

      // Generar código de recuperación (texto plano para mostrar al usuario)
      const recoveryCodePlain = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);
      
      // Hashear para guardar en recovery_codes
      const recoveryCodeHashed = crypto.createHash('sha256').update(recoveryCodePlain).digest('hex');

      // Guardar en BD (sin activar - enabled = false)
      // Guardamos el recovery code en texto plano en backup_codes[0] temporalmente
      await pool.query(
        `INSERT INTO app.user_2fa (user_id, secret, backup_codes, enabled)
         VALUES ($1, $2, $3, false)`,
        [user.id, secret.base32, [recoveryCodePlain]]
      );

      // Guardar recovery code hasheado en tabla separada
      await pool.query(
        `INSERT INTO app.recovery_codes (user_id, code)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET code = $2, last_regenerated = CURRENT_TIMESTAMP`,
        [user.id, recoveryCodeHashed]
      );

      console.log(`✅ Configuración 2FA creada para usuario antiguo: ${user.username}`);

      return NextResponse.json({
        requiresSetup2FA: true,
        userId: user.id,
        username: user.username,
        email: user.email,
        hasPendingSetup: true,
        message: 'Debes configurar la autenticación de 2 factores. Redirigiendo...',
      }, { status: 200 });
    }

    // Si el usuario TIENE A2F configurado
    // NO generar sesión JWT todavía
    // El frontend debe mostrar el diálogo de verificación A2F
    return NextResponse.json({
      requires2FA: true,
      userId: user.id,
      username: user.username,
      message: 'Ingresa el código de tu app de autenticación',
    }, { status: 200 });

    // NOTA: La sesión JWT se genera en /api/auth/2fa/verify
    // después de verificar el código correctamente

  } catch (error) {
    console.error('❌ Error en POST /api/auth/login:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============================================
// ENDPOINT: GET /api/auth/login
// (Opcional - para verificar si el método es correcto)
// ============================================

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Usa POST para iniciar sesión.' },
    { status: 405 }
  );
}
