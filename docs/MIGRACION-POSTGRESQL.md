# 🚀 Guía de Migración a PostgreSQL - Proyecto Chirisu

## 📊 Análisis de la Situación Actual

### Estado Actual
- **Datos mock** en `src/lib/db.ts` (~695 líneas)
- **Datos mock** en `src/lib/data.ts`
- **27+ componentes** importando directamente desde `@/lib/db`
- **Autenticación simulada** en `src/context/auth-context.tsx`
- **Sin base de datos real** - todo en memoria

### Objetivo Final
- **PostgreSQL** como base de datos real
- **API Routes** en `src/app/api/**` para toda lógica de servidor
- **Datos de prueba** en `database/seeds/` para testing
- **Cliente DB seguro** solo accesible desde servidor
- **Componentes** usando `fetch()` en lugar de imports directos

---

## 🗂️ Nueva Estructura de Carpetas

```
Chirisu/
├── database/                          # ⭐ NUEVA
│   ├── schema.sql                     # Tu esquema PostgreSQL completo
│   ├── migrations/                    # Migraciones futuras
│   │   └── 001_initial_schema.sql
│   ├── seeds/                         # Datos de prueba (ex-mocks)
│   │   ├── 01_users.ts
│   │   ├── 02_anime.ts
│   │   ├── 03_manga.ts
│   │   ├── 04_novels.ts
│   │   ├── 05_characters.ts
│   │   └── run-seeds.ts
│   └── queries/                       # Queries SQL reutilizables
│       ├── users.ts
│       ├── media.ts
│       └── lists.ts
│
├── src/
│   ├── lib/
│   │   ├── db.ts                      # ⚡ REEMPLAZAR - Pool de PostgreSQL
│   │   ├── env.ts                     # Validación de env vars
│   │   ├── types.ts                   # Actualizar para reflejar schema
│   │   ├── data.ts                    # ❌ DEPRECAR/MOVER
│   │   └── auth.ts                    # Helpers de autenticación
│   │
│   ├── app/
│   │   ├── api/                       # ⭐ EXPANDIR
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── register/route.ts
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── lists/route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   │
│   │   │   ├── media/
│   │   │   │   ├── anime/
│   │   │   │   │   ├── route.ts       # GET /api/media/anime
│   │   │   │   │   └── [id]/route.ts  # GET /api/media/anime/123
│   │   │   │   ├── manga/
│   │   │   │   ├── novels/
│   │   │   │   ├── manhua/
│   │   │   │   ├── manwha/
│   │   │   │   ├── dougua/
│   │   │   │   └── search/route.ts
│   │   │   │
│   │   │   ├── lists/
│   │   │   │   ├── route.ts           # GET/POST listas
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # PATCH/DELETE lista
│   │   │   │       └── items/route.ts # Gestión de items
│   │   │   │
│   │   │   └── characters/
│   │   │       └── [slug]/route.ts
│   │   │
│   │   └── (páginas...)               # Componentes Cliente usan fetch()
│   │
│   └── context/
│       └── auth-context.tsx           # Actualizar para usar API
│
├── .env.local                         # ⭐ CREAR
├── .env.example                       # Template para otros devs
└── README.md                          # Actualizar con setup DB
```

---

## 🔧 FASE 1: Preparación de la Base de Datos

### 1.1 Instalar PostgreSQL

**Opción A: Local (recomendado para desarrollo)**
```bash
# Windows (con Chocolatey)
choco install postgresql

# O descargar desde: https://www.postgresql.org/download/windows/
```

**Opción B: Remoto (Supabase, Railway, Render)**
- Supabase: https://supabase.com (incluye Auth gratis)
- Railway: https://railway.app
- Render: https://render.com

### 1.2 Crear Base de Datos

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE chirisu_dev;

-- Crear usuario (opcional)
CREATE USER chirisu_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE chirisu_dev TO chirisu_user;

-- Conectarse a la nueva base de datos
\c chirisu_dev
```

### 1.3 Ejecutar el Schema

```bash
# Desde tu terminal PowerShell
cd C:\Users\boris\OneDrive\Documentos\Chirisu
psql -U postgres -d chirisu_dev -f database/schema.sql
```

---

## 🔐 FASE 2: Configuración de Seguridad

### 2.1 Variables de Entorno

Crear `.env.local`:
```env
# Database
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/chirisu_dev
PGSSLMODE=disable

# Auth (NextAuth.js)
NEXTAUTH_SECRET=genera_un_secreto_aleatorio_aqui
NEXTAUTH_URL=http://localhost:9002

# Desarrollo
NODE_ENV=development
DEMO_USER_ID=1
```

### 2.2 Generar Secret

```bash
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2.3 Actualizar .gitignore

Ya está configurado (`.env*` ignorado) ✅

---

## ⚙️ FASE 3: Implementación del Cliente DB

### 3.1 Instalar Dependencias

```bash
npm install pg @types/pg
npm install bcryptjs @types/bcryptjs  # Para hashing de passwords
npm install next-auth                  # Para autenticación
```

### 3.2 Estructura de archivos a crear

Ver sección "Nueva Estructura de Carpetas" arriba.

---

## 📦 FASE 4: Migración de Datos Mock

### 4.1 Extraer Datos de src/lib/db.ts

Los datos mock actuales se dividirán en:
- `database/seeds/01_users.ts` - Usuario demo, admin, moderador
- `database/seeds/02_anime.ts` - Lista de animes
- `database/seeds/03_manga.ts` - Lista de mangas
- Etc.

### 4.2 Script de Seeding

Crear `database/seeds/run-seeds.ts` que inserta datos en PostgreSQL.

---

## 🔄 FASE 5: Migración de Componentes

### Patrón de Migración

**ANTES (Cliente - ❌ Inseguro):**
```typescript
import { getTitleById } from '@/lib/db';

export default function Page({ params }) {
  const title = getTitleById(params.id); // ❌ Ejecuta en cliente
  return <div>{title.name}</div>;
}
```

**DESPUÉS (Server Component - ✅ Seguro):**
```typescript
// Server Component - puede acceder directamente a DB
import { db } from '@/lib/db';

export default async function Page({ params }) {
  const result = await db.query(
    'SELECT * FROM anime WHERE id = $1',
    [params.id]
  );
  const anime = result.rows[0];
  return <div>{anime.title_romaji}</div>;
}
```

**O con API Route (para Client Components):**
```typescript
'use client';

export default function ClientPage({ params }) {
  const [anime, setAnime] = useState(null);
  
  useEffect(() => {
    fetch(`/api/media/anime/${params.id}`)
      .then(res => res.json())
      .then(setAnime);
  }, [params.id]);
  
  return <div>{anime?.title}</div>;
}
```

---

## 🎯 FASE 6: Orden de Migración de Componentes

### Prioridad Alta (autenticación y core)
1. `src/context/auth-context.tsx` → usar `/api/auth/*`
2. `src/app/profile/page.tsx` → usar `/api/user/profile`
3. `src/app/login/page.tsx` → usar `/api/auth/login`

### Prioridad Media (páginas principales)
4. `src/app/page.tsx` → usar `/api/media/anime` (top ranking)
5. `src/app/anime/page.tsx` → usar `/api/media/anime`
6. `src/app/anime/[id]/page.tsx` → usar `/api/media/anime/[id]`
7. Repetir para manga, novels, etc.

### Prioridad Baja (utilidades)
8. `src/components/breadcrumbs.tsx` → fetch desde API
9. `src/components/search-bar.tsx` → usar `/api/media/search`

---

## 🧪 FASE 7: Testing

### 7.1 Verificar Conexión

```bash
npm run dev
# Verificar que no hay errores de conexión DB
```

### 7.2 Probar Endpoints

```bash
# PowerShell
# Test GET anime
curl http://localhost:9002/api/media/anime

# Test POST login
curl -X POST http://localhost:9002/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"user@example.com","password":"userpassword"}'
```

---

## 📈 Progreso de Migración

### ✅ Completado
- [x] Análisis de estructura actual
- [x] Diseño de nueva arquitectura
- [x] Schema PostgreSQL creado

### 🔄 En Proceso
- [ ] Configurar base de datos local
- [ ] Crear cliente DB seguro
- [ ] Implementar API routes

### ⏳ Pendiente
- [ ] Migrar componentes a APIs
- [ ] Sistema de autenticación real
- [ ] Testing completo
- [ ] Deploy a producción

---

## 🚨 Precauciones de Seguridad

### ❌ NUNCA hacer:
1. Importar `src/lib/db.ts` desde componentes `'use client'`
2. Exponer `DATABASE_URL` en el código cliente
3. Enviar contraseñas sin hashear
4. Confiar en datos del cliente sin validación
5. Usar string interpolation en SQL (usar parámetros)

### ✅ SIEMPRE hacer:
1. Usar parámetros preparados: `query('SELECT * FROM users WHERE id = $1', [userId])`
2. Validar inputs con Zod
3. Implementar autenticación en cada API route
4. Verificar permisos (un user solo accede a sus datos)
5. Registrar acciones críticas en `audit_log`

---

## 📚 Recursos Adicionales

- [Node-postgres Docs](https://node-postgres.com/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js](https://next-auth.js.org/)
- [Supabase Docs](https://supabase.com/docs)

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'pg'"
```bash
npm install pg @types/pg
```

### Error: "password authentication failed"
- Verificar `DATABASE_URL` en `.env.local`
- Verificar que PostgreSQL está corriendo: `Get-Service postgresql*`

### Error: "relation does not exist"
- Ejecutar schema.sql: `psql -U postgres -d chirisu_dev -f database/schema.sql`

### Hot Reload Connection Leak
- El patrón singleton con `global.__pgPool__` previene esto ✅

---

**Siguiente Paso:** Continuar con la implementación práctica comenzando por FASE 2.
