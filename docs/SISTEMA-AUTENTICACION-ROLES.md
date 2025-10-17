# 🔐 Sistema de Autenticación y Roles - Base de Datos Unificada v1.0

## 📋 Resumen del Nuevo Sistema

Tu nueva base de datos implementa un sistema robusto de roles y permisos con las siguientes características:

### 🎭 Sistema de Roles

**Tabla: `app.roles`**
```sql
CREATE TABLE app.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('admin', 'moderator', 'user')),
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Roles disponibles:**
- `admin` - Administrador del sistema (acceso total)
- `moderator` - Moderador (gestiona contenido y usuarios)
- `user` - Usuario regular (acceso básico)

### 🔑 Sistema de Permisos

**Tabla: `app.permissions`**
```sql
CREATE TABLE app.permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  resource VARCHAR(50), -- 'media', 'comment', 'review', 'user'
  action VARCHAR(50),   -- 'create', 'read', 'update', 'delete'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplos de permisos:**
- `media.create` - Crear contenido de media
- `media.update` - Actualizar contenido de media
- `media.delete` - Eliminar contenido de media
- `comment.moderate` - Moderar comentarios
- `review.approve` - Aprobar reseñas
- `user.ban` - Banear usuarios

### 👥 Asignación de Roles

**Tabla: `app.user_roles`**
```sql
CREATE TABLE app.user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, role_id)
);
```

Un usuario puede tener **múltiples roles** simultáneamente.

---

## 👤 Estructura de Usuario Actualizada

**Tabla: `app.users`**

### Campos Principales:
```typescript
{
  id: bigint,                      // ID único autoincremental
  uuid: uuid,                      // UUID para referencias externas
  email: string,                   // Email único (login)
  password_hash: string,           // Hash bcrypt del password
  username: string,                // Username único
  display_name: string,            // Nombre para mostrar
  created_at: timestamp,
  updated_at: timestamp,
}
```

### Perfil:
```typescript
{
  date_of_birth: date,
  nationality_code: string,        // ISO 3166-1 alpha-2 (ej: 'CL', 'US')
  nationality_name: string,        // Nombre del país
  nationality_flag_url: string,    // URL de la bandera
  bio: string,                     // Máximo 200 caracteres
  avatar_url: string,
  banner_url: string,
  locale: string,                  // 'es-CL', 'en-US', etc.
}
```

### Sistema de Reputación:
```typescript
{
  points: bigint,                  // Puntos acumulados
  reputation_score: bigint,        // Score de reputación
  level: integer,                  // Nivel del usuario
}
```

### Contadores Denormalizados:
```typescript
{
  contributions_count: integer,    // Total de contribuciones
  saves_count: integer,            // Items en listas
  followers_count: integer,        // Seguidores
  following_count: integer,        // Siguiendo
}
```

### Estado:
```typescript
{
  is_active: boolean,              // Usuario activo/baneado
  deleted_at: timestamp,           // Soft delete
}
```

---

## 🎯 Sistema de Puntos y Reputación

**Tabla: `app.action_points`**

Acciones que otorgan puntos automáticamente:

| Acción | Puntos | Trigger |
|--------|--------|---------|
| `add_to_list` | 2 | Al agregar item a lista |
| `write_review` | 15 | Al escribir reseña |
| `comment_on_media` | 5 | Al comentar en media |
| `receive_upvote` | 3 | Al recibir upvote |
| `receive_downvote` | -2 | Al recibir downvote |

**Función:** `fn_award_points(user_id, points, action, resource_type, resource_id)`

Los triggers ejecutan automáticamente esta función cuando:
- Se agrega un item a una lista
- Se escribe una reseña
- Se comenta en un media
- Se recibe un voto

---

## 🔄 Cambios Importantes vs Sistema Anterior

### ✅ Mejoras Implementadas:

1. **Roles Múltiples**: Un usuario puede tener varios roles (admin + moderator)
2. **Permisos Granulares**: Control fino por recurso y acción
3. **Auditoría**: Se registra quién asignó cada rol y cuándo
4. **Soft Delete**: Los usuarios no se eliminan, se marcan como deleted
5. **UUID**: Identificador universal para integraciones externas
6. **Sistema de Puntos Automático**: Triggers que otorgan puntos por acciones
7. **Contadores Denormalizados**: Performance optimizada
8. **Nacionalidad Completa**: Código ISO, nombre y URL de bandera

### ❌ Campos Removidos del Sistema Anterior:

- `role` (campo simple) → Reemplazado por `user_roles` (tabla relacional)
- Campos de nacionalidad separados → Ahora en tabla users directamente

---

## 🔧 APIs que Necesitan Actualización

### 1. Login (`/api/auth/login`)

**Cambios necesarios:**
- ✅ Ya usa `password_hash` con bcrypt
- 🔄 Debe cargar roles del usuario desde `user_roles`
- 🔄 Debe incluir permisos en el JWT

**Query actualizado:**
```sql
SELECT 
  u.id, u.uuid, u.email, u.username, u.display_name,
  u.avatar_url, u.is_active,
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
GROUP BY u.id;
```

### 2. Session (`/api/auth/session`)

**Debe devolver:**
```typescript
{
  user: {
    id: string,
    email: string,
    username: string,
    displayName: string,
    avatarUrl: string,
    roles: Array<{
      id: number,
      name: 'admin' | 'moderator' | 'user',
      displayName: string
    }>,
    permissions: string[], // ['media.create', 'comment.moderate']
    level: number,
    points: number
  }
}
```

### 3. Profile (`/api/user/profile`)

**Ya implementado correctamente** ✅

Campos GET incluyen toda la info del perfil.
Campos PATCH permiten editar:
- display_name, bio, date_of_birth, nationality_*, locale, avatar_url

---

## 🛡️ Middleware de Autorización

Necesitas crear middleware para verificar permisos:

```typescript
// src/lib/permissions.ts
export async function hasPermission(
  userId: string, 
  resource: string, 
  action: string
): Promise<boolean> {
  // Query para verificar si el usuario tiene el permiso
  const result = await db.query(`
    SELECT COUNT(*) > 0 as has_permission
    FROM app.user_roles ur
    JOIN app.role_permissions rp ON ur.role_id = rp.role_id
    JOIN app.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1
    AND p.resource = $2
    AND p.action = $3
  `, [userId, resource, action]);
  
  return result.rows[0]?.has_permission || false;
}

export async function hasRole(
  userId: string,
  roleName: 'admin' | 'moderator' | 'user'
): Promise<boolean> {
  const result = await db.query(`
    SELECT COUNT(*) > 0 as has_role
    FROM app.user_roles ur
    JOIN app.roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1
    AND r.name = $2
  `, [userId, roleName]);
  
  return result.rows[0]?.has_role || false;
}
```

---

## 📝 Datos Iniciales Requeridos

Para que el sistema funcione, necesitas insertar:

```sql
-- 1. Roles básicos
INSERT INTO app.roles (name, display_name, description) VALUES
('admin', 'Administrador', 'Control total del sistema'),
('moderator', 'Moderador', 'Gestiona contenido y usuarios'),
('user', 'Usuario', 'Usuario regular de la plataforma')
ON CONFLICT (name) DO NOTHING;

-- 2. Permisos básicos
INSERT INTO app.permissions (name, display_name, resource, action) VALUES
-- Media
('media.create', 'Crear Media', 'media', 'create'),
('media.update', 'Actualizar Media', 'media', 'update'),
('media.delete', 'Eliminar Media', 'media', 'delete'),
('media.approve', 'Aprobar Media', 'media', 'approve'),
-- Comments
('comment.create', 'Crear Comentario', 'comment', 'create'),
('comment.moderate', 'Moderar Comentarios', 'comment', 'moderate'),
('comment.delete', 'Eliminar Comentario', 'comment', 'delete'),
-- Reviews
('review.create', 'Crear Reseña', 'review', 'create'),
('review.moderate', 'Moderar Reseñas', 'review', 'moderate'),
-- Users
('user.ban', 'Banear Usuarios', 'user', 'ban'),
('user.assign_roles', 'Asignar Roles', 'user', 'assign_roles')
ON CONFLICT (name) DO NOTHING;

-- 3. Asignar permisos a roles
-- Admin tiene TODOS los permisos
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Moderator tiene permisos de moderación
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'moderator'
AND p.name IN ('comment.moderate', 'review.moderate', 'media.approve')
ON CONFLICT DO NOTHING;

-- User tiene permisos básicos
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'user'
AND p.action = 'create'
ON CONFLICT DO NOTHING;
```

---

## 🚀 Próximos Pasos

1. ✅ **Actualizar API de Login** - Incluir roles y permisos en JWT
2. ✅ **Actualizar API de Session** - Devolver roles y permisos
3. ⏳ **Crear Middleware de Permisos** - Verificar autorizaciones
4. ⏳ **Actualizar Frontend** - Mostrar opciones según roles
5. ⏳ **Insertar Datos Iniciales** - Roles, permisos y asignaciones

---

**Última actualización:** 13 de octubre, 2025
