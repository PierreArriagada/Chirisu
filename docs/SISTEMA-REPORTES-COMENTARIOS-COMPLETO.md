# Sistema de Reportes de Comentarios - Documentación Completa

## 📋 Índice

1. [Visión General](#visión-general)
2. [Flujo Completo](#flujo-completo)
3. [Base de Datos](#base-de-datos)
4. [Sistema de Notificaciones](#sistema-de-notificaciones)
5. [APIs](#apis)
6. [Componentes Frontend](#componentes-frontend)
7. [Lógica de Visibilidad](#lógica-de-visibilidad)
8. [Casos de Uso](#casos-de-uso)

---

## Visión General

El sistema de reportes de comentarios permite a los usuarios de la comunidad reportar comentarios que violen las políticas (spam, acoso, lenguaje ofensivo, spoilers, etc.). Los reportes son recibidos automáticamente por todos los moderadores y administradores a través del sistema de notificaciones.

### Características Principales

- ✅ Reportes con validación (mínimo 10 caracteres)
- ✅ Prevención de reportes duplicados (UNIQUE constraint)
- ✅ Notificaciones automáticas a todos los admins/moderadores
- ✅ Sistema de asignación de casos
- ✅ Regla de visibilidad de 15 días (redistribución de casos abandonados)
- ✅ Historial completo de acciones

---

## Flujo Completo

### 1. Usuario Reporta Comentario

```mermaid
Usuario → Comentario (clic en "Reportar")
  → ReportCommentDialog (dialog se abre)
  → Usuario escribe razón (min 10 chars)
  → POST /api/comments/[id]/report
```

**Archivo**: `src/components/comments/report-comment-dialog.tsx`

**Validaciones Frontend**:
- Mínimo 10 caracteres
- Máximo 500 caracteres
- No puede estar vacío

### 2. API Procesa el Reporte

**Archivo**: `src/app/api/comments/[id]/report/route.ts`

**Validaciones Backend**:
```typescript
✅ Usuario autenticado (JWT válido)
✅ Comentario existe y no está eliminado
✅ No es su propio comentario
✅ No ha reportado antes (UNIQUE: comment_id + reporter_user_id)
✅ Razón tiene mínimo 10 caracteres
```

**INSERT en Base de Datos**:
```sql
INSERT INTO app.comment_reports (
  comment_id,           -- ID del comentario reportado
  reporter_user_id,     -- Quien reporta (del JWT)
  reported_user_id,     -- Autor del comentario
  reason,               -- 'inappropriate_content' (fijo)
  comments,             -- Texto libre del usuario
  status,               -- 'pending'
  created_at
) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
```

### 3. Trigger Automático Crea Notificaciones

**Archivo**: `db-migrations/create-notification-triggers-for-reports.sql`

**Trigger**: `trg_notify_new_comment_report`
**Función**: `fn_notify_new_comment_report()`
**Dispara**: `AFTER INSERT ON app.comment_reports`

**Proceso del Trigger**:

```sql
1. Verifica que status = 'pending'
2. Busca TODOS los usuarios con rol 'admin' o 'moderator'
   - WHERE r.name IN ('admin', 'moderator')
   - AND u.is_active = TRUE
   - AND u.deleted_at IS NULL
3. Para cada admin/moderador encontrado:
   INSERT INTO app.notifications (
     recipient_user_id,  -- ID del admin/moderador
     actor_user_id,      -- ID del usuario que reportó
     action_type,        -- 'comment_reported'
     notifiable_type,    -- 'comment_report'
     notifiable_id,      -- ID del reporte creado
     created_at
   )
```

**Ejemplo Real**:
```
Reporte ID: 1
Reporter: usuario ID 8 (pinwinito)
Notificaciones creadas:
  - Notificación para admin (user 3)
  - Notificación para moderador 1 (user 4)
  - Notificación para moderador 2 (user 9)
Total: 3 notificaciones
```

### 4. Moderador Recibe Notificación

**Archivo**: `src/components/user/notifications-button.tsx`

**Detección**:
```typescript
if (actionType === 'comment_reported' || notifiableType === 'comment_report') {
  router.push('/dashboard/moderator/reported-comments');
}
```

**Mensaje Mostrado**:
```
"[actor_username] reportó un comentario para revisión"
```

### 5. Moderador Ve Lista de Reportes

**Página**: `/dashboard/moderator/reported-comments`
**Archivo**: `src/app/dashboard/moderator/reported-comments/page.tsx`

**API Llamada**:
```typescript
GET /api/admin/reported-comments?status=pending&currentUserId=${userId}&isAdmin=${isAdmin}
```

**Archivo API**: `src/app/api/admin/reported-comments/route.ts`

### 6. Moderador Actúa sobre el Reporte

**Opciones**:
- ✅ Asignarse el caso: `POST /api/comment-reports/[id]/assign`
- ✅ Resolver (eliminar comentario): `PATCH /api/admin/reported-comments`
- ✅ Rechazar (sin acción): `PATCH /api/admin/reported-comments`
- ✅ Liberar caso: `DELETE /api/comment-reports/[id]/assign`

---

## Base de Datos

### Tabla: `app.comment_reports`

```sql
CREATE TABLE app.comment_reports (
  id                  SERIAL PRIMARY KEY,
  comment_id          INTEGER NOT NULL REFERENCES app.comments(id),
  reporter_user_id    INTEGER NOT NULL REFERENCES app.users(id),
  reported_user_id    INTEGER NOT NULL REFERENCES app.users(id),
  reason              VARCHAR(50) NOT NULL,
  comments            TEXT,
  status              VARCHAR(20) DEFAULT 'pending',
  assigned_to         INTEGER REFERENCES app.users(id),
  assigned_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW(),
  resolved_at         TIMESTAMP,
  resolved_by         INTEGER REFERENCES app.users(id),
  resolution_notes    TEXT,
  action_taken        VARCHAR(50),
  
  -- Constraint: Usuario solo puede reportar un comentario una vez
  UNIQUE(comment_id, reporter_user_id)
);
```

### Valores Válidos

**status**:
- `'pending'` - Pendiente de revisión (estado inicial)
- `'reviewing'` - En revisión por un moderador
- `'resolved'` - Resuelto (acción tomada)
- `'rejected'` - Rechazado (no viola políticas)

**reason** (categoría):
- `'spam'`
- `'offensive_language'`
- `'harassment'`
- `'spoilers'`
- `'irrelevant_content'`
- `'misinformation'`
- `'other'`

**action_taken** (acción del moderador):
- `'no_action'` - Sin acción necesaria
- `'warning_sent'` - Advertencia enviada al usuario
- `'comment_deleted'` - Comentario eliminado
- `'user_warned'` - Usuario advertido formalmente
- `'user_suspended'` - Usuario suspendido

### Índices

```sql
CREATE INDEX idx_comment_reports_status ON app.comment_reports(status);
CREATE INDEX idx_comment_reports_comment_id ON app.comment_reports(comment_id);
CREATE INDEX idx_comment_reports_reporter ON app.comment_reports(reporter_user_id);
CREATE INDEX idx_comment_reports_reported_user ON app.comment_reports(reported_user_id);
CREATE INDEX idx_comment_reports_created ON app.comment_reports(created_at DESC);
CREATE INDEX idx_comment_reports_assigned ON app.comment_reports(assigned_to) WHERE assigned_to IS NOT NULL;
```

---

## Sistema de Notificaciones

### Tabla: `app.notifications`

```sql
CREATE TABLE app.notifications (
  id                  SERIAL PRIMARY KEY,
  recipient_user_id   INTEGER NOT NULL REFERENCES app.users(id),
  actor_user_id       INTEGER REFERENCES app.users(id),
  action_type         VARCHAR(50) NOT NULL,
  notifiable_type     VARCHAR(50) NOT NULL,
  notifiable_id       INTEGER NOT NULL,
  read_at             TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
);
```

### Notificación de Reporte de Comentario

**Creada por**: Trigger `trg_notify_new_comment_report`

**Estructura**:
```json
{
  "id": 30,
  "recipient_user_id": 3,           // Admin/Moderador que recibe
  "actor_user_id": 8,               // Usuario que reportó
  "action_type": "comment_reported", // Tipo de acción
  "notifiable_type": "comment_report", // Tipo de entidad
  "notifiable_id": 1,               // ID del reporte
  "read_at": null,                  // null = no leída
  "created_at": "2025-11-11T16:33:34.722Z"
}
```

### Destinatarios de Notificaciones

**Query del Trigger**:
```sql
SELECT DISTINCT u.id
FROM app.users u
INNER JOIN app.user_roles ur ON ur.user_id = u.id
INNER JOIN app.roles r ON ur.role_id = r.id
WHERE r.name IN ('admin', 'moderator')
  AND u.is_active = TRUE
  AND u.deleted_at IS NULL
```

**Cantidad de Notificaciones**:
- 1 notificación por cada admin activo
- 1 notificación por cada moderador activo
- Total = Número de admins + Número de moderadores

---

## APIs

### POST /api/comments/[id]/report

**Propósito**: Crear reporte de comentario

**Headers**:
```
Content-Type: application/json
Cookie: chirisu_session=[JWT]
```

**Body**:
```json
{
  "reason": "Este comentario contiene spoilers sin marcar" // min 10 chars
}
```

**Respuesta Exitosa**:
```json
{
  "success": true,
  "message": "Reporte enviado. Será revisado por los moderadores."
}
```

**Errores Posibles**:
```json
// No autenticado
{ "error": "No autenticado" } // 401

// Comentario no encontrado
{ "error": "Comentario no encontrado" } // 404

// Propio comentario
{ "error": "No puedes reportar tu propio comentario" } // 400

// Ya reportado antes
{ "error": "Ya has reportado este comentario" } // 400

// Razón muy corta
{ "error": "La razón del reporte debe tener al menos 10 caracteres" } // 400
```

---

### GET /api/admin/reported-comments

**Propósito**: Obtener lista de reportes para moderadores/admins

**Query Params**:
- `status` - 'pending' | 'reviewing' | 'resolved' | 'rejected' (default: 'pending')
- `page` - Número de página (default: 1)
- `limit` - Reportes por página (default: 50)

**Headers**:
```
Cookie: chirisu_session=[JWT]
```

**Respuesta**:
```json
{
  "reports": [
    {
      "reportId": 1,
      "reason": "spam",
      "description": "Este comentario es spam",
      "status": "pending",
      "reportedAt": "2025-11-11T16:33:34.722Z",
      "resolvedAt": null,
      "resolvedBy": null,
      "assignedToUserId": null,
      "assignedToUsername": null,
      "assignedToDisplayName": null,
      "assignedAt": null,
      "comment": {
        "id": 1,
        "content": "Contenido del comentario reportado",
        "isSpoiler": false,
        "commentableType": "anime",
        "commentableId": 123,
        "createdAt": "2025-11-10T12:00:00.000Z",
        "author": {
          "id": 9,
          "displayName": "Indosnesia",
          "avatarUrl": "https://...",
          "level": 5
        }
      },
      "reporter": {
        "id": 8,
        "displayName": "pinwinito",
        "avatarUrl": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

**Lógica de Visibilidad** (ver sección dedicada abajo)

---

### POST /api/comment-reports/[id]/assign

**Propósito**: Asignarse un reporte

**Response**:
```json
{
  "success": true,
  "message": "Reporte asignado exitosamente"
}
```

---

### DELETE /api/comment-reports/[id]/assign

**Propósito**: Liberar un reporte asignado

**Response**:
```json
{
  "success": true,
  "message": "Asignación removida exitosamente"
}
```

---

### PATCH /api/admin/reported-comments

**Propósito**: Resolver o rechazar reporte

**Body**:
```json
{
  "reportId": 1,
  "status": "resolved", // o "rejected"
  "action": "comment_deleted", // opcional
  "resolutionNotes": "Comentario eliminado por spam" // opcional
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reporte actualizado exitosamente"
}
```

---

## Componentes Frontend

### ReportCommentDialog

**Archivo**: `src/components/comments/report-comment-dialog.tsx`

**Props**:
```typescript
interface ReportCommentDialogProps {
  commentId: string;   // ID del comentario a reportar
  isOpen: boolean;     // Estado de visibilidad
  onClose: () => void; // Callback para cerrar
}
```

**Estados**:
- `reason` - Texto del reporte (10-500 caracteres)
- `isSubmitting` - Loading durante envío

**Flujo**:
1. Usuario abre dialog desde menú del comentario
2. Escribe razón (min 10 chars)
3. Presiona "Enviar reporte"
4. POST a `/api/comments/[id]/report`
5. Toast de confirmación
6. Dialog se cierra

---

### ReportedCommentsContent

**Archivo**: `src/components/moderation/reported-comments-content.tsx`

**Props**:
```typescript
interface ReportedCommentsContentProps {
  status: 'pending' | 'resolved' | 'rejected';
}
```

**Responsabilidades**:
- Fetch de reportes desde API
- Mostrar lista con paginación
- Acciones: Asignar, Resolver, Rechazar, Ver comentario original

---

### NotificationsButton

**Archivo**: `src/components/user/notifications-button.tsx`

**Responsabilidades**:
- Detectar notificaciones de tipo `comment_reported`
- Mostrar mensaje: "X reportó un comentario para revisión"
- Redirigir a `/dashboard/moderator/reported-comments` al hacer clic

---

## Lógica de Visibilidad

### Regla de 15 Días

Los moderadores ven un reporte SI cumple **cualquiera** de estas condiciones:

#### A) Es Admin
```sql
$isAdmin = true
```
→ Ve **TODOS** los reportes sin restricción

#### B) Reporte sin Asignar
```sql
assigned_to IS NULL
```
→ Reporte disponible para cualquier moderador

#### C) Reporte Asignado a Él
```sql
assigned_to = $currentUserId
```
→ Moderador ve sus propios casos

#### D) Reporte Abandonado (+15 días)
```sql
assigned_at < NOW() - INTERVAL '15 days'
AND status != 'resolved'
```
→ Redistribuir casos abandonados después de 15 días

### Query SQL Completa

```sql
SELECT * FROM app.comment_reports cr
INNER JOIN app.comments c ON cr.comment_id = c.id
WHERE cr.status = 'pending'
  AND c.deleted_at IS NULL
  AND (
    -- A) Es admin
    $isAdmin = true 
    -- B) Sin asignar
    OR cr.assigned_to IS NULL 
    -- C) Asignado a él
    OR cr.assigned_to = $currentUserId
    -- D) +15 días sin resolver
    OR (cr.assigned_at < NOW() - INTERVAL '15 days' 
        AND cr.status != 'resolved')
  )
ORDER BY cr.created_at DESC
```

### Razón de la Lógica

**Problema**: Sin control de visibilidad, múltiples moderadores podrían trabajar en el mismo caso simultáneamente.

**Solución**: Sistema de asignación con redistribución automática.

**Beneficios**:
- ✅ Evita duplicación de esfuerzos
- ✅ Balance de carga entre moderadores
- ✅ Casos no se quedan estancados (+15 días → disponible para otros)
- ✅ Admin mantiene supervisión completa

---

## Casos de Uso

### Caso 1: Usuario Reporta Spam

1. Usuario ve comentario spam: "Compra ahora en..."
2. Clic en menú → "Reportar comentario"
3. Escribe: "Este comentario es publicidad no solicitada"
4. Submit → API crea reporte
5. Trigger notifica a 3 moderadores (admin + 2 mods)
6. Moderador 1 recibe notificación, hace clic
7. Ve el reporte en lista de "Pendientes"
8. Hace clic en "Asignármelo"
9. Revisa el comentario: efectivamente es spam
10. Selecciona "Resolver" → "Eliminar comentario"
11. Comentario marcado como deleted_at = NOW()
12. Reporte marcado como resolved

**Resultado**: Comentario spam eliminado, reporte cerrado

---

### Caso 2: Reporte Rechazado (Falso Positivo)

1. Usuario reporta: "Este comentario me ofende"
2. Comentario real: "No me gustó el final del anime"
3. Moderador revisa: es opinión válida, no ofensiva
4. Selecciona "Rechazar"
5. Escribe nota: "Comentario es opinión personal válida"
6. Reporte marcado como rejected
7. Comentario permanece visible

**Resultado**: Reporte archivado, sin acción sobre el comentario

---

### Caso 3: Caso Abandonado (Regla 15 Días)

1. Moderador A se asigna reporte el día 1
2. Moderador A no lo resuelve
3. Pasan 16 días sin cambio de status
4. Moderador B entra a panel
5. Ve el reporte en su lista (regla +15 días)
6. Se lo asigna y lo resuelve

**Resultado**: Casos no se quedan estancados indefinidamente

---

### Caso 4: Admin Supervisa

1. Admin entra a panel de reportes
2. Ve TODOS los reportes (pending, asignados, sin asignar)
3. Puede reasignar casos si lo considera necesario
4. Puede ver rendimiento de moderadores

**Resultado**: Supervisión completa del sistema

---

## Archivos Relacionados

### Base de Datos
- `db-migrations/create-comment-reports.sql` - Creación de tabla
- `db-migrations/create-notification-triggers-for-reports.sql` - Trigger de notificaciones
- `docs/DATABASE-SCHEMA.md` - Esquema completo

### APIs
- `src/app/api/comments/[id]/report/route.ts` - Crear reporte
- `src/app/api/admin/reported-comments/route.ts` - Listar/resolver reportes
- `src/app/api/comment-reports/[id]/assign/route.ts` - Asignar/liberar

### Componentes
- `src/components/comments/report-comment-dialog.tsx` - Dialog de reporte
- `src/components/moderation/reported-comments-content.tsx` - Lista de reportes
- `src/components/user/notifications-button.tsx` - Notificaciones

### Páginas
- `src/app/dashboard/moderator/reported-comments/page.tsx` - Panel de moderador
- `src/app/dashboard/admin/reported-comments/page.tsx` - Panel de admin

### Tipos
- `src/lib/types.ts` - ReportedComment type

---

## Notas Importantes

### Unicidad de Reportes
```sql
UNIQUE(comment_id, reporter_user_id)
```
→ Un usuario solo puede reportar un comentario **una vez**

### Trigger Automático
- NO requiere código manual de notificaciones en la API
- Se ejecuta automáticamente en cada INSERT
- Garantiza consistencia de notificaciones

### Contador de Caracteres
- Frontend: 10-500 caracteres
- Backend: mínimo 10 caracteres validado
- Previene reportes vacíos o spam

### Estados Finales
- `resolved` - Caso cerrado con acción
- `rejected` - Caso cerrado sin acción
- Ambos excluidos de regla de 15 días

---

## Diagrama del Flujo Completo

```
USUARIO                    API                     BASE DE DATOS              TRIGGER                MODERADOR
   |                        |                            |                        |                        |
   |--[Reportar]----------->|                            |                        |                        |
   |                        |--[Validar]                 |                        |                        |
   |                        |                            |                        |                        |
   |                        |--[INSERT comment_reports]->|                        |                        |
   |                        |                            |--[AFTER INSERT]------->|                        |
   |                        |                            |                        |--[Buscar admins/mods]  |
   |                        |                            |                        |                        |
   |                        |                            |<--[INSERT notifications (x3)]------------------|
   |                        |                            |                        |                        |
   |<--[Success]------------|                            |                        |                        |
   |                        |                            |                        |                        |
   |                        |                            |                        |        [Nueva notif]-->|
   |                        |                            |                        |                        |
   |                        |                            |                        |                <--[Clic]
   |                        |                            |                        |                        |
   |                        |<--[GET /api/admin/reported-comments?status=pending]-------------------------|
   |                        |--[Query con visibilidad]-->|                        |                        |
   |                        |<--[Lista de reportes]------|                        |                        |
   |                        |                            |                        |                        |
   |                        |--------[Enviar JSON]---------------------------------------------->|
   |                        |                            |                        |           [Ve lista]   |
   |                        |                            |                        |                        |
   |                        |<--[PATCH resolve/reject]-------------------------------------------|
   |                        |--[UPDATE status]---------->|                        |                        |
   |                        |<--[Success]----------------|                        |                        |
   |                        |                            |                        |                        |
   |                        |--------[Confirmación]-------------------------------------------->|
```

---

## Conclusión

El sistema de reportes de comentarios está completamente integrado con:

✅ **Base de datos** - Tabla `comment_reports` con constraints y índices
✅ **Triggers** - Notificaciones automáticas a admins/moderadores
✅ **APIs** - Endpoints validados y seguros
✅ **Frontend** - Componentes React bien estructurados
✅ **Notificaciones** - Sistema completo de alertas
✅ **Visibilidad** - Lógica de 15 días para distribución de carga
✅ **Logging** - Trazabilidad completa de operaciones

El flujo es robusto, escalable y mantiene la integridad de los datos en todo momento.
