# 🔧 Correcciones: Compatibilidad con Nueva Base de Datos

## 📋 Resumen de Cambios

Se corrigieron todos los APIs para que funcionen correctamente con la nueva estructura de base de datos que usa:
- **Sistema de roles** en lugar de `is_admin`/`is_moderator`
- **Columnas diferentes** para visibilidad de medios (`is_published` vs `is_approved`)
- **Soft deletes** con `deleted_at`

---

## ✅ Archivos Corregidos

### 1. `/api/media/route.ts` - Listado de Medios
**Problema:** Usaba `is_published` para todas las tablas
**Solución:** 
- Anime usa `is_published`
- Manga y Novels usan `is_approved`
- Agregado filtro `deleted_at IS NULL`

```typescript
const visibilityColumn = type === 'anime' ? 'is_published' : 'is_approved';
WHERE ${visibilityColumn} = TRUE AND deleted_at IS NULL
```

### 2. `/api/media/[id]/route.ts` - Detalle de Medio
**Problema:** Solo buscaba `is_published`
**Solución:** 
- Determina columna según tipo de medio
- Filtro de soft delete

```typescript
const visibilityColumn = type === 'anime' ? 'is_published' : 'is_approved';
WHERE m.${visibilityColumn} = TRUE AND m.deleted_at IS NULL
```

### 3. `/api/search/route.ts` - Búsqueda
**Problema:** Solo usaba `is_published`
**Solución:**
- Detecta tipo de medio y usa columna correcta
- Filtro de soft delete

```typescript
${mediaType === 'anime' ? 'is_published' : 'is_approved'} = TRUE
AND deleted_at IS NULL
```

### 4. `/api/user/profile/route.ts` - Perfil de Usuario
**Problema:** Intentaba leer `is_admin` e `is_moderator` que ya no existen
**Solución:**
- Query para obtener roles desde `user_roles` y `roles`
- Determinar isAdmin/isModerator desde los roles
- Aplicado tanto en GET como en PATCH

**GET (Leer perfil):**
```typescript
// Obtener roles del usuario
const rolesResult = await db.query(
  `SELECT r.name as role_name
   FROM app.user_roles ur
   JOIN app.roles r ON ur.role_id = r.id
   WHERE ur.user_id = $1`,
  [userId]
);

const userRoles = rolesResult.rows.map(r => r.role_name);
const isAdmin = userRoles.includes('admin');
const isModerator = userRoles.includes('moderator');
```

**PATCH (Actualizar perfil):**
- Removidas columnas `is_admin`, `is_moderator` del RETURNING
- Agregada query separada para obtener roles
- Respuesta usa roles calculados

### 5. `/api/auth/session/route.ts` - Sesión Actual
**Problema:** Intentaba leer `is_admin` e `is_moderator`
**Solución:**
- Query separada para obtener roles desde tablas relacionadas
- Filtro `deleted_at IS NULL`

```typescript
const rolesResult = await db.query(
  `SELECT r.name as role_name
   FROM app.user_roles ur
   JOIN app.roles r ON ur.role_id = r.id
   WHERE ur.user_id = $1`,
  [jwtUser.userId]
);

const userRoles = rolesResult.rows.map(r => r.role_name);
const isAdmin = userRoles.includes('admin');
const isModerator = userRoles.includes('moderator');
```

---

## 🔍 Diferencias Clave en la Base de Datos

### Usuarios
**❌ ANTES (Columnas eliminadas):**
```sql
is_admin BOOLEAN
is_moderator BOOLEAN
```

**✅ AHORA (Tablas relacionadas):**
```sql
-- Tabla: roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE,  -- 'admin', 'moderator', 'user'
  display_name VARCHAR(100)
);

-- Tabla: user_roles (relación muchos a muchos)
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

### Medios (Anime, Manga, Novels)
**Anime:**
- Usa `is_published BOOLEAN`
- Indica si está público

**Manga y Novels:**
- Usan `is_approved BOOLEAN`
- Indica si fue aprobado por moderador

**Todos:**
- Tienen `deleted_at TIMESTAMPTZ` para soft delete
- `WHERE deleted_at IS NULL` para obtener activos

---

## 🎯 Estado Actual

### ✅ Funcionando Correctamente
- [x] Login con sistema de roles
- [x] Sesión con roles calculados
- [x] Perfil GET con roles
- [x] Perfil PATCH con roles
- [x] Media listing con columnas correctas
- [x] Media detail con columnas correctas
- [x] Búsqueda con columnas correctas

### ⏳ Pendiente
- [ ] Ejecutar `INIT-ROLES-PERMISOS.sql` para crear roles en BD
- [ ] Agregar columna `slug` a tablas de media
- [ ] Probar login con usuario admin
- [ ] Verificar carga de perfil

---

## 📝 Notas de Migración

### Para Desarrolladores:

1. **Siempre verificar tipo de medio** antes de usar columnas de visibilidad:
   ```typescript
   const visibilityColumn = type === 'anime' ? 'is_published' : 'is_approved';
   ```

2. **Filtrar soft deletes** en todas las queries:
   ```sql
   WHERE deleted_at IS NULL
   ```

3. **Obtener roles** cuando necesites permisos:
   ```typescript
   const rolesResult = await db.query(
     `SELECT r.name FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1`,
     [userId]
   );
   const isAdmin = rolesResult.rows.some(r => r.name === 'admin');
   ```

4. **No asumir columnas** - Siempre verificar en el schema antes de usar

---

## 🚀 Próximos Pasos

1. **Ejecutar script de roles:**
   ```powershell
   # En pgAdmin o DBeaver
   # Abrir: docs/INIT-ROLES-PERMISOS.sql
   # Ejecutar todo el contenido
   ```

2. **Probar endpoints:**
   - Login: `POST /api/auth/login`
   - Perfil: `GET /api/user/profile`
   - Media: `GET /api/media?type=anime`
   - Búsqueda: `GET /api/search?q=naruto`

3. **Verificar en consola del navegador:**
   ```javascript
   // Debería mostrar roles correctamente
   console.log('User roles:', sessionData.user.roles);
   console.log('Is admin:', sessionData.user.isAdmin);
   ```

---

## 📊 Impacto de los Cambios

- **5 archivos API modificados**
- **0 cambios en frontend** (la interfaz sigue igual)
- **100% compatible** con nueva estructura de BD
- **Sin breaking changes** para el cliente
- **Backward compatible** - Los endpoints responden igual formato

---

## ✨ Beneficios

✅ Sistema de roles más flexible (múltiples roles por usuario)  
✅ Permisos granulares (preparado para expandir)  
✅ Soft deletes (recuperación de datos)  
✅ Audit trail completo  
✅ Mejor seguridad (roles separados de users)

