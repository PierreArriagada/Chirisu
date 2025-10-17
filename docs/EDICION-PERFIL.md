# 📝 Edición de Perfil de Usuario

## ✅ Implementación Completa

### Descripción
Página de edición de perfil que permite a los usuarios actualizar su información personal básica de forma segura.

---

## 📍 Ubicación de Archivos

### Frontend
- **Página de edición**: `src/app/profile/edit/page.tsx`
- **Página de perfil**: `src/app/profile/page.tsx` (con botón "Editar Perfil")

### Backend
- **API endpoint**: `src/app/api/user/profile/route.ts`
  - Método: `PATCH /api/user/profile`

---

## 🔧 Campos Editables

Según el esquema de la base de datos PostgreSQL (`app.users`):

### ✅ Campos Permitidos

| Campo | Tipo | Límite | Descripción |
|-------|------|--------|-------------|
| `display_name` | VARCHAR(120) | 120 caracteres | Nombre público del usuario |
| `avatar_url` | VARCHAR(500) | 500 caracteres | URL de la imagen de avatar |
| `bio` | VARCHAR(200) | 200 caracteres | Biografía del usuario |
| `date_of_birth` | DATE | - | Fecha de nacimiento (no puede ser futura) |
| `nationality_code` | CHAR(2) | 2 caracteres | Código ISO del país (ej: "CL", "MX") |
| `nationality_name` | VARCHAR(100) | 100 caracteres | Nombre del país |
| `nationality_flag_url` | VARCHAR(500) | 500 caracteres | URL de la bandera del país |
| `locale` | VARCHAR(10) | 10 caracteres | Idioma preferido (ej: "es-CL", "en-US") |

### ❌ Campos Bloqueados (No Editables)

Los siguientes campos **NO** son editables desde la interfaz de usuario por seguridad:

- `id`, `uuid` - Identificadores únicos
- `email`, `username` - Información de cuenta
- `password_hash` - Contraseña (requiere proceso separado)
- `is_admin`, `is_moderator` - Roles (solo administradores)
- `points`, `reputation_score`, `level` - Sistema de reputación (automático)
- `contributions_count`, `saves_count` - Contadores (automáticos)
- `is_active` - Estado de cuenta (solo administradores)
- `created_at`, `updated_at` - Timestamps del sistema

---

## 🌍 Países Disponibles

Lista de países preconfigurados en el selector:

```javascript
const COUNTRIES = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  // ... 18 países más
];
```

---

## 🔒 Validaciones

### Frontend (Cliente)

1. **Display Name**:
   - Máximo 120 caracteres
   - Contador de caracteres visible

2. **Bio**:
   - Máximo 200 caracteres
   - Contador de caracteres visible
   - Textarea no redimensionable

3. **Avatar URL**:
   - Máximo 500 caracteres
   - Vista previa en tiempo real
   - Fallback si la imagen no carga

4. **Fecha de Nacimiento**:
   - No puede ser futura
   - Input tipo `date` nativo

### Backend (Servidor)

```typescript
// Validaciones en PATCH /api/user/profile
if (display_name !== undefined && display_name.length > 120) {
  return 400; // Nombre demasiado largo
}

if (bio !== undefined && bio.length > 200) {
  return 400; // Bio demasiado larga
}

if (date_of_birth !== undefined) {
  const birthDate = new Date(date_of_birth);
  const today = new Date();
  if (birthDate > today) {
    return 400; // Fecha futura
  }
}
```

---

## 🚀 Flujo de Usuario

### 1. Acceso a la Página de Edición

```
Perfil (/profile) 
  → Botón "Editar Perfil" 
  → Redirección a /profile/edit
```

### 2. Carga de Datos Actuales

```javascript
// GET /api/user/profile
const response = await fetch('/api/user/profile');
const data = await response.json();

// Pre-llenar formulario con valores actuales
setFormData({
  display_name: profile.display_name || '',
  avatar_url: profile.avatar_url || '',
  bio: profile.bio || '',
  date_of_birth: profile.date_of_birth || '',
  nationality_code: profile.nationality_code || '',
  locale: profile.locale || 'es-CL',
});
```

### 3. Edición y Validación

- El usuario edita los campos
- Validación en tiempo real
- Contador de caracteres visible
- Vista previa de avatar

### 4. Guardado

```javascript
// PATCH /api/user/profile
const response = await fetch('/api/user/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    display_name: formData.display_name,
    avatar_url: formData.avatar_url,
    bio: formData.bio,
    date_of_birth: formData.date_of_birth,
    nationality_code: formData.nationality_code,
    nationality_name: country.name,
    nationality_flag_url: `https://flagcdn.com/w80/${code.toLowerCase()}.png`,
    locale: formData.locale,
  }),
});
```

### 5. Confirmación

- Toast de éxito: "Perfil actualizado"
- Redirección automática a `/profile` después de 1 segundo
- Actualización de `updated_at` en la BD

---

## 📡 API Endpoint

### `PATCH /api/user/profile`

**Request Body:**
```json
{
  "display_name": "Mi Nombre",
  "avatar_url": "https://ejemplo.com/avatar.jpg",
  "bio": "Amante del anime y manga desde 2010",
  "date_of_birth": "1995-05-15",
  "nationality_code": "CL",
  "nationality_name": "Chile",
  "nationality_flag_url": "https://flagcdn.com/w80/cl.png",
  "locale": "es-CL"
}
```

**Response (Éxito - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "usuario123",
    "display_name": "Mi Nombre",
    "avatar_url": "https://ejemplo.com/avatar.jpg",
    "bio": "Amante del anime y manga desde 2010",
    "date_of_birth": "1995-05-15",
    "nationality_code": "CL",
    "nationality_name": "Chile",
    "nationality_flag_url": "https://flagcdn.com/w80/cl.png",
    "locale": "es-CL",
    "is_admin": false,
    "is_moderator": false
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "El nombre es demasiado largo (máximo 120 caracteres)"
}
```

**Response (No autenticado - 401):**
```json
{
  "error": "No autenticado. Inicia sesión primero."
}
```

---

## 🗄️ Actualización en Base de Datos

### SQL Query Dinámico

El endpoint construye un query SQL dinámico basado en los campos proporcionados:

```sql
UPDATE app.users 
SET 
  display_name = $1,
  avatar_url = $2,
  bio = $3,
  date_of_birth = $4,
  nationality_code = $5,
  nationality_name = $6,
  nationality_flag_url = $7,
  locale = $8,
  updated_at = NOW()
WHERE id = $9
RETURNING id, email, username, display_name, avatar_url, bio, 
          date_of_birth, nationality_code, nationality_name, 
          nationality_flag_url, locale, is_admin, is_moderator;
```

### Auditoría

Cada actualización se registra en `app.audit_log`:

```sql
INSERT INTO app.audit_log (user_id, action, resource_type, payload)
VALUES ($1, 'update_profile', 'user', $2);
```

---

## 🎨 Interfaz de Usuario

### Componentes Utilizados

- **shadcn/ui**:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  - `Input`, `Textarea`, `Select`, `Label`
  - `Button`
  - `Skeleton` (para loading)

### Secciones de la Página

1. **Header**:
   - Botón "Volver al perfil" (con icono ArrowLeft)
   - Título: "Editar Perfil"
   - Descripción

2. **Card: Información Básica**:
   - Nombre para mostrar (con contador)
   - Avatar URL (con vista previa)
   - Biografía (textarea con contador)

3. **Card: Información Personal**:
   - Fecha de nacimiento
   - Nacionalidad (selector con banderas)
   - Idioma preferido

4. **Botones de Acción**:
   - Cancelar (vuelve a `/profile`)
   - Guardar cambios (con loading state)

---

## 🧪 Testing

### Pruebas Manuales

1. **Cargar página de edición**:
   ```
   http://localhost:9002/profile/edit
   ```

2. **Verificar pre-llenado**:
   - Todos los campos deben mostrar valores actuales
   - Avatar debe mostrarse si existe

3. **Probar validaciones**:
   - Intentar bio > 200 caracteres → Error
   - Intentar display_name > 120 caracteres → Error
   - Fecha de nacimiento futura → Error

4. **Guardar cambios**:
   - Editar varios campos
   - Guardar
   - Verificar toast de éxito
   - Verificar redirección a `/profile`
   - Verificar que cambios se reflejan en perfil

5. **Probar nacionalidad**:
   - Seleccionar país
   - Guardar
   - Verificar bandera en perfil

### Casos de Error

1. **Usuario no autenticado**:
   - Debe redirigir a `/login`

2. **Validación fallida**:
   - Debe mostrar mensaje de error
   - No debe enviar request

3. **Error de servidor**:
   - Debe mostrar toast de error
   - No debe redirigir

---

## 📝 Notas Importantes

### Seguridad

- ✅ Solo el usuario autenticado puede editar su propio perfil
- ✅ JWT verificado en cada request
- ✅ Campos sensibles bloqueados
- ✅ Validación en cliente Y servidor
- ✅ Sanitización de inputs (trim)

### Nacionalidad

Cuando se selecciona un país:
- `nationality_code`: Código ISO (ej: "CL")
- `nationality_name`: Nombre completo (ej: "Chile")
- `nationality_flag_url`: URL de flagcdn.com (80px)

### Locale

Idiomas soportados:
- `es-CL` - Español (Chile)
- `es-ES` - Español (España)
- `es-MX` - Español (México)
- `es-AR` - Español (Argentina)
- `en-US` - English (US)
- `pt-BR` - Português (Brasil)
- `ja-JP` - 日本語
- `ko-KR` - 한국어

---

## 🔜 Mejoras Futuras

1. **Subir avatar**:
   - Integración con servicio de almacenamiento (S3, Cloudinary)
   - Recorte de imágenes
   - Compresión automática

2. **Cambio de contraseña**:
   - Página separada `/profile/security`
   - Verificación de contraseña actual
   - Validación de contraseña nueva

3. **Cambio de email**:
   - Verificación por email
   - Confirmación de nuevo email

4. **Eliminación de cuenta**:
   - Página de confirmación
   - Soft delete o hard delete

5. **Historial de cambios**:
   - Ver auditoría de cambios en perfil
   - Revertir cambios

---

## ✅ Checklist de Implementación

- [x] Página de edición creada (`/profile/edit`)
- [x] Formulario con todos los campos editables
- [x] Validaciones en frontend
- [x] Validaciones en backend
- [x] API endpoint actualizado (PATCH)
- [x] Botón en perfil principal
- [x] Loading states
- [x] Error handling
- [x] Toast notifications
- [x] Redirección post-guardado
- [x] Auditoría en base de datos
- [x] Documentación completa

---

**Última actualización**: 13 de octubre de 2025
