# Arquitectura del Sistema Chirisu

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Capa de Presentación](#capa-de-presentación)
4. [Capa de Aplicación](#capa-de-aplicación)
5. [Capa de Datos](#capa-de-datos)
6. [Flujos de Datos](#flujos-de-datos)
7. [Patrones de Diseño](#patrones-de-diseño)

---

## Visión General

Chirisu es una plataforma web moderna de seguimiento de anime, manga y contenido relacionado, construida con tecnologías de vanguardia siguiendo una arquitectura híbrida que combina Server-Side Rendering (SSR) y Client-Side Rendering (CSR).

### Principios Arquitectónicos

1. **Server-First**: Prioriza Server Components para mejor rendimiento
2. **Progressive Enhancement**: Funcionalidad básica sin JavaScript
3. **Type Safety**: TypeScript en todo el código
4. **Separation of Concerns**: Capas bien definidas
5. **DRY (Don't Repeat Yourself)**: Reutilización de componentes y lógica

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                       NAVEGADOR                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            React Components (Cliente)                  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Client    │  │   Context    │  │    Hooks    │  │  │
│  │  │ Components  │  │   Providers  │  │             │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 SERVER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Server Components                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │  Pages   │  │ Layouts  │  │  Data Fetching   │    │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  API Routes                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │   Auth   │  │  Media   │  │  Comments/Lists  │    │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ SQL Queries
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL 17                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Schema: app                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │  Tables  │  │ Triggers │  │    Functions     │    │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Capa de Presentación

### Estructura de Componentes

```
components/
├── ui/                          # Componentes base de UI
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   └── ...
│
├── comments/                    # Sistema de comentarios
│   ├── comments-section.tsx    # Contenedor principal (Client)
│   ├── comment-item.tsx        # Item individual (Client)
│   ├── comment-form.tsx        # Formulario (Client)
│   └── index.ts                # Barrel export
│
├── moderation/                  # Componentes de moderación
│   ├── reported-comments-content.tsx
│   ├── disapproval-dialog.tsx
│   └── review-contribution-dialog.tsx
│
├── [entity]-card.tsx           # Cards de entidades (Server)
├── [entity]-display.tsx        # Displays de entidades (Server)
└── user-avatar.tsx             # Componente mínimo (Client)
```

### Server Components vs Client Components

#### Server Components (Default)
```typescript
// Sin 'use client' directive
// Beneficios:
// - Zero JavaScript al cliente
// - Acceso directo a BD
// - Mejor SEO

export default async function MediaPage({ params }) {
  const data = await getMediaData(params.id);
  return <div>{/* Renderizado en servidor */}</div>
}
```

#### Client Components (Solo cuando es necesario)
```typescript
'use client';

// Solo para:
// - Event handlers (onClick, onChange, etc.)
// - useState, useEffect, useContext
// - Browser APIs

export function CommentForm() {
  const [comment, setComment] = useState('');
  return <form>{/* Interactividad */}</form>
}
```

### Patrón de Composición

```typescript
// Servidor: Fetching y lógica
export default async function Page() {
  const data = await fetchData();
  
  return (
    <div>
      <ServerContent data={data} />
      <ClientInteractive initialData={data} />
    </div>
  );
}

// Cliente: Solo interactividad
'use client';
export function ClientInteractive({ initialData }) {
  const [state, setState] = useState(initialData);
  return <button onClick={() => setState(...)}>Click</button>
}
```

---

## Capa de Aplicación

### API Routes Structure

```
app/api/
├── auth/
│   ├── login/route.ts           # POST /api/auth/login
│   ├── register/route.ts        # POST /api/auth/register
│   └── session/route.ts         # GET /api/auth/session
│
├── user/
│   ├── route.ts                 # GET, PATCH /api/user
│   ├── lists/route.ts           # GET, POST /api/user/lists
│   ├── favorites/route.ts       # GET /api/user/favorites
│   └── notifications/route.ts   # GET /api/user/notifications
│
├── media/
│   └── [id]/route.ts            # GET /api/media/[id]
│
├── comments/
│   ├── route.ts                 # GET, POST /api/comments
│   └── [id]/
│       ├── route.ts             # PATCH, DELETE /api/comments/[id]
│       ├── react/route.ts       # POST /api/comments/[id]/react
│       └── report/route.ts      # POST /api/comments/[id]/report
│
└── admin/
    ├── contributions/route.ts   # GET, PATCH /api/admin/contributions
    └── reported-comments/route.ts # GET, PATCH /api/admin/reported-comments
```

### Patrón de API Route

```typescript
// GET Handler
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación (si es necesario)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validación de parámetros
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // 3. Query a base de datos
    const result = await pool.query('SELECT * FROM table WHERE id = $1', [id]);

    // 4. Formateo de respuesta
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST Handler
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const user = await getCurrentUser();
    
    // 2. Parse body
    const body = await request.json();
    
    // 3. Validación
    if (!body.requiredField) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // 4. Operación de BD
    const result = await pool.query(
      'INSERT INTO table (field) VALUES ($1) RETURNING id',
      [body.requiredField]
    );

    // 5. Respuesta
    return NextResponse.json({
      success: true,
      id: result.rows[0].id
    }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Autenticación y Autorización

#### getCurrentUser()
```typescript
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('chirisu_session')?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Obtener información completa del usuario con roles
  const user = await pool.query(`
    SELECT u.*, 
           EXISTS(SELECT 1 FROM user_roles ur 
                  JOIN roles r ON ur.role_id = r.id 
                  WHERE ur.user_id = u.id AND r.name = 'admin') as is_admin,
           EXISTS(SELECT 1 FROM user_roles ur 
                  JOIN roles r ON ur.role_id = r.id 
                  WHERE ur.user_id = u.id AND r.name = 'moderator') as is_moderator
    FROM users u
    WHERE u.id = $1 AND u.deleted_at IS NULL
  `, [payload.userId]);

  return user.rows[0];
}
```

---

## Capa de Datos

### Schema de Base de Datos

#### Entidades Principales

```sql
-- Usuarios
app.users
  ├── id (PK)
  ├── username (UNIQUE)
  ├── email (UNIQUE)
  ├── password_hash
  ├── level (calculado por puntos)
  ├── points
  ├── created_at
  └── deleted_at (soft delete)

-- Roles
app.roles
  ├── id (PK)
  └── name (admin, moderator, user)

app.user_roles
  ├── user_id (FK)
  └── role_id (FK)

-- Medios (Polimórfico)
app.anime
app.manga
app.novels
app.donghua
app.manhua
app.manhwa
app.fan_comics
  ├── id (PK)
  ├── slug (UNIQUE)
  ├── title
  ├── synopsis
  ├── status
  ├── ranking
  └── [campos específicos]

-- Personajes y Personal
app.characters
app.voice_actors
app.staff
  ├── id (PK)
  ├── slug (UNIQUE)
  ├── name
  ├── bio
  └── favorites_count

-- Relaciones
app.user_lists
app.list_items (polimórfico)
app.user_favorites (polimórfico)
app.reviews (polimórfico)
app.comments (polimórfico, anidado)
app.comment_reactions
app.user_contributions
app.content_reports
```

#### Relaciones Polimórficas

```sql
-- Ejemplo: Comentarios en múltiples entidades
CREATE TABLE app.comments (
  id SERIAL PRIMARY KEY,
  commentable_type VARCHAR(50),  -- 'anime', 'character', etc.
  commentable_id INTEGER,        -- ID de la entidad
  user_id INTEGER REFERENCES app.users(id),
  parent_id INTEGER REFERENCES app.comments(id),  -- Para anidamiento
  content TEXT,
  -- ...
);

-- Ejemplo de query
SELECT * FROM comments 
WHERE commentable_type = 'anime' 
  AND commentable_id = 22;
```

### Triggers y Funciones

#### fn_award_points()
```sql
CREATE OR REPLACE FUNCTION fn_award_points(
  p_user_id INTEGER,
  p_points INTEGER,
  p_action_name VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  new_level INTEGER;
BEGIN
  -- Actualizar puntos
  UPDATE app.users 
  SET points = points + p_points,
      contributions_count = contributions_count + 1
  WHERE id = p_user_id;

  -- Calcular nuevo nivel
  SELECT fn_calculate_level(points) INTO new_level
  FROM app.users WHERE id = p_user_id;

  -- Actualizar nivel
  UPDATE app.users 
  SET level = new_level
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

#### Triggers Automáticos
```sql
-- Trigger para otorgar puntos al comentar
CREATE TRIGGER trg_comment_insert
AFTER INSERT ON app.comments
FOR EACH ROW
EXECUTE FUNCTION app.trg_comment_insert();

-- Trigger para actualizar contadores
CREATE TRIGGER trg_update_favorites_count
AFTER INSERT OR DELETE ON app.user_favorites
FOR EACH ROW
EXECUTE FUNCTION app.trg_update_favorites_count();
```

### Pool de Conexiones

```typescript
// lib/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bd_chirisu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,                      // Máximo 20 conexiones
  idleTimeoutMillis: 30000,     // 30 segundos
  connectionTimeoutMillis: 2000 // 2 segundos
});

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de PostgreSQL', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Cliente PostgreSQL conectado');
});
```

---

## Flujos de Datos

### Flujo de Autenticación

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ 1. Ingresa credenciales
     ▼
┌──────────────────┐
│  Login Form      │
│  (Client)        │
└────┬─────────────┘
     │ 2. POST /api/auth/login
     ▼
┌──────────────────┐
│  API Route       │
│  - Valida datos  │
│  - Verifica pass │
│  - Genera JWT    │
└────┬─────────────┘
     │ 3. Consulta BD
     ▼
┌──────────────────┐
│  PostgreSQL      │
│  - Busca user    │
│  - Compara hash  │
└────┬─────────────┘
     │ 4. Usuario válido
     ▼
┌──────────────────┐
│  API Route       │
│  - Crea JWT      │
│  - Set cookie    │
└────┬─────────────┘
     │ 5. Response con cookie
     ▼
┌──────────────────┐
│  Browser         │
│  - Guarda cookie │
│  - Redirect      │
└──────────────────┘
```

### Flujo de Comentario

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ 1. Escribe comentario
     ▼
┌────────────────────┐
│  CommentForm       │
│  (Client)          │
│  - Valida input    │
│  - Muestra preview │
└────┬───────────────┘
     │ 2. Submit
     ▼
┌────────────────────┐
│  CommentsSection   │
│  (Client)          │
│  - handleSubmit()  │
└────┬───────────────┘
     │ 3. POST /api/comments
     ▼
┌────────────────────┐
│  API Route         │
│  - Verifica auth   │
│  - Valida datos    │
└────┬───────────────┘
     │ 4. INSERT comment
     ▼
┌────────────────────┐
│  PostgreSQL        │
│  - Inserta         │
│  - Trigger puntos  │
│  - Trigger notif   │
└────┬───────────────┘
     │ 5. Comment creado
     ▼
┌────────────────────┐
│  API Route         │
│  - Return comment  │
└────┬───────────────┘
     │ 6. Response
     ▼
┌────────────────────┐
│  CommentsSection   │
│  - Actualiza UI    │
│  - Muestra toast   │
└────────────────────┘
```

### Flujo de Contribución

```
┌─────────┐
│ Usuario │
└────┬────┘
     │ 1. Llena formulario
     ▼
┌──────────────────────┐
│  ContributionForm    │
│  (Client)            │
└────┬─────────────────┘
     │ 2. POST /api/contributions
     ▼
┌──────────────────────┐
│  API Route           │
│  - Valida datos      │
│  - Guarda como       │
│    "pending"         │
└────┬─────────────────┘
     │ 3. INSERT contribution
     ▼
┌──────────────────────┐
│  PostgreSQL          │
└────┬─────────────────┘
     │ 4. Contribution guardada
     ▼
┌──────────────────────┐
│  Usuario recibe      │
│  confirmación        │
└──────────────────────┘

    ... Tiempo pasa ...

┌──────────────┐
│  Moderador   │
└────┬─────────┘
     │ 5. Revisa dashboard
     ▼
┌──────────────────────┐
│  Moderation Panel    │
│  - Ve pending        │
│  - Decide acción     │
└────┬─────────────────┘
     │ 6. Aprobar/Rechazar
     ▼
┌──────────────────────┐
│  API Route           │
│  - Si aprueba:       │
│    * Crea entidad    │
│    * Otorga puntos   │
│  - Si rechaza:       │
│    * Marca rejected  │
└────┬─────────────────┘
     │ 7. Notifica usuario
     ▼
┌──────────────────────┐
│  Notification        │
│  System              │
└──────────────────────┘
```

---

## Patrones de Diseño

### 1. Repository Pattern (Implícito)

```typescript
// lib/repositories/user-repository.ts
export class UserRepository {
  static async findById(id: number) {
    const result = await pool.query(
      'SELECT * FROM app.users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  }

  static async create(userData: CreateUserDto) {
    const result = await pool.query(
      'INSERT INTO app.users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [userData.username, userData.email, userData.passwordHash]
    );
    return result.rows[0];
  }
}
```

### 2. Factory Pattern

```typescript
// Creación de notificaciones según tipo
export function createNotification(type: NotificationType, data: any) {
  switch (type) {
    case 'comment_reply':
      return new CommentReplyNotification(data);
    case 'contribution_approved':
      return new ContributionApprovedNotification(data);
    // ...
  }
}
```

### 3. Strategy Pattern

```typescript
// Ordenamiento de comentarios
const sortStrategies = {
  newest: 'c.created_at DESC',
  oldest: 'c.created_at ASC',
  most_liked: 'c.likes_count DESC, c.created_at DESC'
};

const orderBy = sortStrategies[sortParam] || sortStrategies.newest;
```

### 4. Composition Pattern

```typescript
// Server Component compone Client Components
export default function MediaPage() {
  return (
    <div>
      <ServerSideContent />      {/* Sin JS */}
      <ClientInteraction />      {/* Con JS */}
    </div>
  );
}
```

### 5. Provider Pattern

```typescript
// Context para estado global
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Uso
export function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 6. Singleton Pattern

```typescript
// Pool de base de datos
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool(config);
  }
  return pool;
}
```

---

## Diagrama de Componentes Clave

```
┌────────────────────────────────────────────────────────────┐
│                      RootLayout                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 AuthProvider                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              ThemeProvider                      │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │          Navigation                       │  │  │  │
│  │  │  │  - MainNav (Server)                       │  │  │  │
│  │  │  │  - NotificationsButton (Client)           │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │          Page Content                     │  │  │  │
│  │  │  │  [Dinámico según ruta]                    │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

Esta arquitectura proporciona una base sólida, escalable y mantenible para el proyecto Chirisu, aprovechando las capacidades modernas de Next.js 15 y PostgreSQL.
