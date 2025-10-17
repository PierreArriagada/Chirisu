# 🎯 Pasos Inmediatos para Completar la Migración

## ✅ Lo que ya está listo

1. **Estructura de carpetas creada:**
   - `database/` - Para schema, seeds, queries
   - `database/queries/` - Queries SQL reutilizables
   - `src/lib/database.ts` - Cliente PostgreSQL seguro
   - `src/lib/env.ts` - Validación de variables de entorno

2. **Archivos de configuración:**
   - `.env.example` - Template de variables de entorno
   - `tsconfig.json` - Actualizado con path `@/database/*`
   - Cliente DB con singleton pattern (previene leaks)

3. **API Routes de ejemplo:**
   - `/api/media/anime` - Listado de animes
   - `/api/media/anime/[id]` - Anime específico

4. **Queries SQL organizadas:**
   - `database/queries/users.ts` - CRUD de usuarios
   - `database/queries/media.ts` - CRUD de medios

---

## 🚀 PASO 1: Configurar PostgreSQL (URGENTE)

### Opción A: Instalación Local (Recomendado para desarrollo)

```powershell
# 1. Instalar PostgreSQL
# Descargar desde: https://www.postgresql.org/download/windows/
# O con Chocolatey:
choco install postgresql

# 2. Iniciar servicio
Get-Service postgresql* | Start-Service

# 3. Conectar y crear base de datos
psql -U postgres

# En el prompt psql:
CREATE DATABASE chirisu_dev;
\c chirisu_dev
\q
```

### Opción B: Supabase (Gratis, incluye Auth)

```
1. Ir a https://supabase.com
2. Crear cuenta gratis
3. Crear nuevo proyecto "Chirisu"
4. Copiar DATABASE_URL desde Settings > Database
5. Pegar en .env.local
```

---

## 🔧 PASO 2: Crear archivo .env.local

```powershell
# Copiar template
Copy-Item .env.example .env.local

# Editar .env.local con tus valores:
# - DATABASE_URL (tu conexión a PostgreSQL)
# - Generar NEXTAUTH_SECRET (ver comando abajo)
```

### Generar NEXTAUTH_SECRET:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
# Copiar el resultado en .env.local
```

---

## 📊 PASO 3: Ejecutar el Schema SQL

```powershell
# Guarda tu esquema SQL en database/schema.sql
# Luego ejecuta:

psql -U postgres -d chirisu_dev -f database/schema.sql

# Deberías ver output como:
# CREATE EXTENSION
# CREATE SCHEMA
# CREATE TABLE
# etc.
```

---

## 🌱 PASO 4: Crear Seeds (Datos de Prueba)

Necesitas crear archivos en `database/seeds/` que inserten datos iniciales.

### Ejemplo: database/seeds/01_users.sql

```sql
-- Insertar usuario demo (password: 'userpassword')
INSERT INTO app.users (email, username, password_hash, display_name, is_active)
VALUES (
  'user@example.com',
  'usuario_demo',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- bcrypt hash
  'Usuario Demo',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Repetir para admin, moderador
```

### Ejecutar seeds:

```powershell
psql -U postgres -d chirisu_dev -f database/seeds/01_users.sql
```

---

## 🧪 PASO 5: Probar la Conexión

```powershell
# Iniciar servidor de desarrollo
npm run dev

# Abrir otra terminal y probar API:
curl http://localhost:9002/api/media/anime

# Deberías ver:
# {"data":[],"pagination":{"limit":20,"offset":0,"total":0}}
```

---

## 🔐 PASO 6: Implementar Autenticación

### Instalar dependencias:

```powershell
npm install next-auth bcryptjs @types/bcryptjs
npm install @next-auth/prisma-adapter  # opcional
```

### Crear API route de login:

Ver archivo: `src/app/api/auth/login/route.ts` (pendiente)

---

## 📝 PASO 7: Actualizar Componentes

### Patrón de migración:

**ANTES:**
```typescript
import { getTitleById } from '@/lib/db';  // ❌

export default function Page({ params }) {
  const title = getTitleById(params.id);
  return <div>{title.name}</div>;
}
```

**DESPUÉS (Server Component):**
```typescript
import { db } from '@/lib/database';  // ✅

export default async function Page({ params }) {
  const result = await db.query(
    'SELECT * FROM app.anime WHERE id = $1',
    [params.id]
  );
  const anime = result.rows[0];
  return <div>{anime.title_romaji}</div>;
}
```

**O con API (Client Component):**
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function Page({ params }) {
  const [anime, setAnime] = useState(null);
  
  useEffect(() => {
    fetch(`/api/media/anime/${params.id}`)
      .then(res => res.json())
      .then(data => setAnime(data.data));
  }, [params.id]);
  
  return <div>{anime?.title_romaji}</div>;
}
```

---

## 📋 Orden de Migración de Archivos

### PRIORIDAD 1 (Core):
1. ✅ `src/lib/database.ts` - Cliente DB
2. ✅ `src/lib/env.ts` - Validación env
3. ⏳ `src/app/api/auth/login/route.ts`
4. ⏳ `src/app/api/auth/register/route.ts`
5. ⏳ `src/context/auth-context.tsx` - Usar APIs

### PRIORIDAD 2 (Usuarios):
6. ⏳ `src/app/api/user/profile/route.ts`
7. ⏳ `src/app/api/user/lists/route.ts`
8. ⏳ `src/app/profile/page.tsx` - Usar API

### PRIORIDAD 3 (Medios):
9. ✅ `src/app/api/media/anime/route.ts`
10. ✅ `src/app/api/media/anime/[id]/route.ts`
11. ⏳ `src/app/anime/page.tsx` - Usar API
12. ⏳ `src/app/anime/[id]/page.tsx` - Usar API
13. ⏳ Repetir para manga, novels, etc.

### PRIORIDAD 4 (Búsqueda y Extras):
14. ⏳ `src/app/api/media/search/route.ts`
15. ⏳ `src/app/search/page.tsx`
16. ⏳ `src/components/breadcrumbs.tsx`

---

## ⚠️ Puntos Críticos

1. **NO importar `src/lib/database.ts` desde componentes `'use client'`**
   - Solo en API routes y Server Components
   - Client components usan `fetch()`

2. **Siempre usar parámetros en queries**
   ```typescript
   // ❌ MAL - SQL Injection
   db.query(`SELECT * FROM users WHERE id = ${userId}`)
   
   // ✅ BIEN
   db.query('SELECT * FROM users WHERE id = $1', [userId])
   ```

3. **Hash de passwords**
   ```typescript
   import bcrypt from 'bcryptjs';
   const hash = await bcrypt.hash(password, 10);
   ```

4. **Validación de inputs**
   ```typescript
   import { z } from 'zod';
   const schema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   });
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/database/queries/media'"
- ✅ Ya solucionado: `tsconfig.json` actualizado con path alias

### Error: "MODULE_NOT_FOUND: pg"
```powershell
npm install pg @types/pg
```

### Error: "password authentication failed"
- Revisar DATABASE_URL en .env.local
- Verificar que PostgreSQL está corriendo

### Error: "relation 'app.anime' does not exist"
- Ejecutar schema.sql:
  ```powershell
  psql -U postgres -d chirisu_dev -f database/schema.sql
  ```

---

## 📚 Recursos de Ayuda

- PostgreSQL Docs: https://www.postgresql.org/docs/
- node-postgres: https://node-postgres.com/
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- NextAuth.js: https://next-auth.js.org/

---

## ✨ Siguiente Acción Inmediata

**AHORA:** Ejecuta PASO 1 y PASO 2:

```powershell
# 1. Crear .env.local
Copy-Item .env.example .env.local

# 2. Editar .env.local con tu DATABASE_URL
code .env.local

# 3. Instalar dependencias que faltan
npm install bcryptjs @types/bcryptjs next-auth

# 4. Iniciar servidor de desarrollo
npm run dev
```

Después de esto, continuaremos con las API routes de autenticación y migración de componentes.
