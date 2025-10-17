# 🔐 GUÍA COMPLETA: Implementar Login Real con PostgreSQL

## 📋 RESUMEN DE LO QUE VAMOS A HACER

### Estado Actual:
- ❌ Login usa `simulatedUsers` array en memoria
- ❌ Passwords en texto plano
- ❌ Sin persistencia real
- ❌ AuthContext busca en array local

### Estado Final:
- ✅ Login usa API route `/api/auth/login`
- ✅ Passwords hasheados con bcrypt
- ✅ Datos desde PostgreSQL
- ✅ Sesiones con cookies HTTP-only
- ✅ AuthContext llama a la API

---

## 🗂️ ARCHIVOS A CREAR/MODIFICAR

### 1️⃣ CREAR (Nuevos archivos):
```
src/app/api/auth/
├── login/route.ts          # API para login
├── logout/route.ts         # API para logout
├── session/route.ts        # API para verificar sesión
└── register/route.ts       # API para registro (opcional)

src/lib/
└── auth.ts                 # Helpers de autenticación (JWT, bcrypt)

database/seeds/
└── 01_users.sql            # Insertar usuarios demo en PostgreSQL
```

### 2️⃣ MODIFICAR (Archivos existentes):
```
src/context/auth-context.tsx    # Cambiar de array a API
src/app/login/page.tsx          # Ya está bien, no tocar
```

---

## 🔢 PASO 1: Instalar Dependencias

```bash
# Ejecutar en PowerShell:
npm install bcryptjs jsonwebtoken cookie
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie
```

**¿Qué hace cada uno?**
- `bcryptjs`: Hashear y comparar passwords
- `jsonwebtoken`: Crear tokens JWT para sesiones
- `cookie`: Parsear cookies HTTP

---

## 🔢 PASO 2: Crear Usuarios en PostgreSQL

### 📄 Archivo: `database/seeds/01_users.sql`

```sql
-- ============================================
-- INSERTAR USUARIOS DE PRUEBA EN POSTGRESQL
-- ============================================

-- Passwords hasheados con bcrypt (costo 10)
-- admin@example.com -> adminpassword
-- moderator@example.com -> modpassword
-- user@example.com -> userpassword

INSERT INTO app.users (
  email, 
  username, 
  password_hash, 
  display_name, 
  is_admin, 
  is_moderator,
  avatar_url
) VALUES 
  -- ADMIN
  (
    'admin@example.com',
    'admin_demo',
    '$2a$10$YourHashedPasswordHere1',  -- TODO: Reemplazar con hash real
    'Admin Demo',
    TRUE,
    FALSE,
    'https://picsum.photos/seed/admin-avatar/100/100'
  ),
  
  -- MODERADOR
  (
    'moderator@example.com',
    'moderador_demo',
    '$2a$10$YourHashedPasswordHere2',  -- TODO: Reemplazar con hash real
    'Moderador Demo',
    FALSE,
    TRUE,
    'https://picsum.photos/seed/mod-avatar/100/100'
  ),
  
  -- USUARIO NORMAL
  (
    'user@example.com',
    'usuario_demo',
    '$2a$10$YourHashedPasswordHere3',  -- TODO: Reemplazar con hash real
    'Usuario Demo',
    FALSE,
    FALSE,
    'https://picsum.photos/seed/user-avatar/100/100'
  )
ON CONFLICT (email) DO NOTHING;

-- Crear listas por defecto para cada usuario
SELECT app.fn_create_default_lists(id) FROM app.users WHERE email IN (
  'admin@example.com',
  'moderator@example.com', 
  'user@example.com'
);

-- Verificar que se crearon correctamente
SELECT id, email, username, display_name, is_admin, is_moderator 
FROM app.users 
WHERE email IN ('admin@example.com', 'moderator@example.com', 'user@example.com');
```

**⚠️ IMPORTANTE: Generar los hashes reales**

Ejecuta este script Node.js para generar los hashes:

```javascript
// Ejecutar: node generate-hashes.js
const bcrypt = require('bcryptjs');

const passwords = [
  { email: 'admin@example.com', password: 'adminpassword' },
  { email: 'moderator@example.com', password: 'modpassword' },
  { email: 'user@example.com', password: 'userpassword' }
];

passwords.forEach(async ({ email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  console.log(`${email}: ${hash}`);
});
```

Luego reemplaza los `$2a$10$YourHashedPasswordHere` con los hashes generados.

**Ejecutar el seed:**
```bash
psql -U postgres -d chirisu_dev -f database/seeds/01_users.sql
```

---

## 🔢 PASO 3: Crear Helpers de Autenticación

### 📄 Archivo: `src/lib/auth.ts`

```typescript
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
}

export interface SessionUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
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
```

---

## 🔢 PASO 4: Crear API Route de Login

### 📄 Archivo: `src/app/api/auth/login/route.ts`

```typescript
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
  is_admin: boolean;
  is_moderator: boolean;
  is_active: boolean;
}

// ============================================
// ENDPOINT: POST /api/auth/login
// ============================================

export async function POST(request: NextRequest) {
  try {
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

    // 2. BUSCAR USUARIO EN LA BASE DE DATOS
    const result = await db.query<UserRow>(
      `SELECT 
        id, 
        email, 
        username, 
        password_hash, 
        display_name, 
        avatar_url, 
        is_admin, 
        is_moderator,
        is_active
       FROM app.users 
       WHERE email = $1 
       LIMIT 1`,
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

    // 4. GENERAR TOKEN JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin,
      isModerator: user.is_moderator,
    });

    // 5. ESTABLECER COOKIE DE SESIÓN
    await setSessionCookie(token);

    // 6. PREPARAR RESPUESTA (SIN PASSWORD)
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      isAdmin: user.is_admin,
      isModerator: user.is_moderator,
    };

    // 7. REGISTRAR EN AUDIT LOG (opcional pero recomendado)
    await db.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type)
       VALUES ($1, 'login', 'auth')`,
      [user.id]
    );

    // 8. RETORNAR RESPUESTA EXITOSA
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
```

---

## 🔢 PASO 5: Crear API Route de Sesión

### 📄 Archivo: `src/app/api/auth/session/route.ts`

```typescript
/**
 * ========================================
 * API ROUTE: SESIÓN ACTUAL
 * GET /api/auth/session
 * ========================================
 * 
 * Verifica si hay una sesión activa y retorna
 * los datos del usuario autenticado.
 * 
 * Se llama al cargar la app para restaurar sesión.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';
import type { SessionUser } from '@/lib/auth';

export async function GET() {
  try {
    // 1. OBTENER USUARIO ACTUAL DEL TOKEN JWT
    const jwtUser = await getCurrentUser();

    // No hay sesión
    if (!jwtUser) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    // 2. OBTENER DATOS ACTUALIZADOS DE LA BASE DE DATOS
    // (por si cambiaron permisos, nombre, etc.)
    const result = await db.query<{
      id: number;
      email: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      is_admin: boolean;
      is_moderator: boolean;
      is_active: boolean;
    }>(
      `SELECT 
        id, email, username, display_name, avatar_url, 
        is_admin, is_moderator, is_active
       FROM app.users 
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [jwtUser.userId]
    );

    // Usuario no encontrado o desactivado
    if (result.rows.length === 0) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // 3. PREPARAR RESPUESTA
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      isAdmin: user.is_admin,
      isModerator: user.is_moderator,
    };

    return NextResponse.json({
      user: sessionUser,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/auth/session:', error);
    
    return NextResponse.json(
      { error: 'Error al verificar sesión' },
      { status: 500 }
    );
  }
}
```

---

## 🔢 PASO 6: Crear API Route de Logout

### 📄 Archivo: `src/app/api/auth/logout/route.ts`

```typescript
/**
 * ========================================
 * API ROUTE: LOGOUT
 * POST /api/auth/logout
 * ========================================
 * 
 * Cierra la sesión eliminando la cookie.
 */

import { NextResponse } from 'next/server';
import { deleteSessionCookie, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function POST() {
  try {
    // Obtener usuario actual (antes de borrar cookie)
    const user = await getCurrentUser();

    // Eliminar cookie de sesión
    await deleteSessionCookie();

    // Registrar en audit log
    if (user) {
      await db.query(
        `INSERT INTO app.audit_log (user_id, action, resource_type)
         VALUES ($1, 'logout', 'auth')`,
        [user.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/auth/logout:', error);
    
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
```

---

## 🔢 PASO 7: Actualizar AuthContext

### 📄 Archivo: `src/context/auth-context.tsx`

**REEMPLAZAR COMPLETAMENTE EL ARCHIVO ACTUAL CON ESTO:**

```typescript
'use client';

/**
 * ========================================
 * AUTH CONTEXT - GESTIÓN DE AUTENTICACIÓN
 * ========================================
 * 
 * CAMBIOS PRINCIPALES:
 * - ❌ YA NO USA simulatedUsers array
 * - ✅ LLAMA A /api/auth/login
 * - ✅ LLAMA A /api/auth/logout
 * - ✅ LLAMA A /api/auth/session
 * - ✅ Restaura sesión al cargar la app
 * 
 * TODO LO DEMÁS SE MANTIENE IGUAL (toggleFavorite, etc.)
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// ============================================
// TIPOS
// ============================================

// TODO: Actualizar estos tipos para que coincidan con tu schema PostgreSQL
export interface User {
  id: number;  // ⚠️ Cambió de string a number
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  // TODO: Agregar más campos si los necesitas:
  // lists?: { ... }
  // listSettings?: { ... }
  // customLists?: CustomList[]
}

// Placeholder - actualizar con tu tipo real
export interface TitleInfo {
  id: string;
  title: string;
  // ... resto de campos
}

// ============================================
// CONTEXTO
// ============================================

interface AuthContextType {
  user: User | null;
  loading: boolean;  // NUEVO: para mostrar spinner mientras carga sesión
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  toggleFavorite: (title: TitleInfo) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // NUEVO
  const router = useRouter();
  const { toast } = useToast();

  // ==========================================
  // EFECTO: RESTAURAR SESIÓN AL CARGAR LA APP
  // ==========================================
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);  // Terminó de cargar
      }
    }

    checkSession();
  }, []);

  // ==========================================
  // LOGIN: LLAMA A /api/auth/login
  // ==========================================
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Error del servidor (401, 400, etc.)
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Login exitoso
      setUser(data.user);
      
    } catch (error) {
      // Re-lanzar para que lo capture el componente de login
      throw error;
    }
  };

  // ==========================================
  // LOGOUT: LLAMA A /api/auth/logout
  // ==========================================
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar la sesión.',
      });
    }
  };

  // ==========================================
  // UPDATE USER (mantener igual por ahora)
  // ==========================================
  const updateUser = (updatedUser: User) => {
    // TODO: En el futuro, llamar a /api/user/profile con PATCH
    setUser(updatedUser);
  };

  // ==========================================
  // TOGGLE FAVORITE (mantener igual por ahora)
  // ==========================================
  const toggleFavorite = (title: TitleInfo) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Necesitas iniciar sesión',
        description: 'Para añadir a favoritos, primero debes iniciar sesión.',
      });
      router.push('/login');
      return;
    }

    // TODO: Implementar con API route /api/user/favorites
    // Por ahora, solo muestra un mensaje
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás añadir a favoritos con la base de datos real.',
    });
  };

  // ==========================================
  // PROVIDER VALUE
  // ==========================================
  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    toggleFavorite,
  };

  // Mostrar spinner mientras carga la sesión inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

## 🔢 PASO 8: Actualizar .env.local

Asegúrate de que `.env.local` tenga:

```env
# Ya tienes DATABASE_URL ✅

# Agregar este:
NEXTAUTH_SECRET=tu_secreto_jwt_aqui

# Generar con:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ VERIFICACIÓN FINAL

### 1. Verificar que los archivos están creados:

```
✅ src/lib/auth.ts
✅ src/app/api/auth/login/route.ts
✅ src/app/api/auth/session/route.ts
✅ src/app/api/auth/logout/route.ts
✅ src/context/auth-context.tsx (actualizado)
✅ database/seeds/01_users.sql
```

### 2. Ejecutar seeds:

```powershell
# Generar hashes
node generate-hashes.js

# Insertar usuarios
psql -U postgres -d chirisu_dev -f database/seeds/01_users.sql
```

### 3. Iniciar servidor:

```powershell
npm run dev
```

### 4. Probar login:

```
1. Ir a http://localhost:9002/login
2. Ingresar: user@example.com / userpassword
3. Debería redirigir a /profile
4. Ver datos del usuario en consola
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs jsonwebtoken cookie
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie
```

### Error: "jwt must be a string"
- Verificar que `NEXTAUTH_SECRET` está en `.env.local`

### Error: "relation app.users does not exist"
- Ejecutar schema.sql primero

### Login no funciona:
- Abrir DevTools > Network
- Ver request a `/api/auth/login`
- Verificar status code y response

---

## 📝 NOTAS FINALES

- ✅ Passwords NUNCA se guardan en texto plano
- ✅ Cookies son HTTP-only (JavaScript no puede acceder)
- ✅ Tokens JWT expiran en 7 días
- ✅ Sesión se restaura automáticamente al recargar
- ✅ Audit log registra logins/logouts

**PRÓXIMO PASO:** Implementar `/api/user/profile` para obtener listas, favoritos, etc.
