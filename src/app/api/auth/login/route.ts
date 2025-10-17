/**
 * ========================================
 * API ROUTE: LOGIN
 * POST /api/auth/login
 * ========================================
 * 
 * FLUJO:
 * 1. Recibe email y password del cliente
 * 2. Busca usuario en PostgreSQL
 * 3. Verifica password con bcrypt
 * 4. Genera token JWT
 * 5. Establece cookie HTTP-only
 * 6. Retorna datos del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { 
  verifyPassword, 
  generateToken, 
  setSessionCookie,
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

    // 2. BUSCAR USUARIO EN LA BASE DE DATOS CON SUS ROLES
    const result = await db.query<UserRow>(
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

    // 5. GENERAR TOKEN JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin,
      isModerator,
      roles: roles.map(r => r.name),
    });

    // 6. ESTABLECER COOKIE DE SESIÓN
    await setSessionCookie(token);

    // 7. PREPARAR RESPUESTA (SIN PASSWORD)
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      isAdmin,
      isModerator,
      roles: roles.map(r => r.name),
      level: user.level,
      points: user.points,
    };

    // 8. REGISTRAR EN AUDIT LOG (opcional pero recomendado)
    await db.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type)
       VALUES ($1, 'login', 'auth')`,
      [user.id]
    );

    // 9. RETORNAR RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      user: sessionUser,
    });

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
