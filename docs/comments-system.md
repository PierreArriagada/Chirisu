# 💬 Sistema Completo de Comentarios - Chirisu

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo y robusto de comentarios para la plataforma Chirisu que cumple con todos los requisitos especificados.

---

## ✅ Funcionalidades Implementadas

### 1. **Comentarios por Tipo de Medio** ✓
- ✅ Soporte para los 7 tipos de media:
  - Anime
  - Manga
  - Novelas (novels)
  - Donghua
  - Manhua
  - Manhwa
  - Fan Comics

### 2. **Comentarios Únicos por Medio** ✓
- ✅ Cada anime/manga/etc tiene sus propios comentarios
- ✅ Jujutsu Kaisen (anime) y Jujutsu Kaisen (manga) tienen comentarios separados
- ✅ Estructura polimórfica: `commentable_type` + `commentable_id`

### 3. **Sistema de Respuestas Anidadas** ✓
- ✅ Comentarios principales (sin padre)
- ✅ Respuestas a comentarios (con `parent_id`)
- ✅ Botón "X respuestas" muestra/oculta el hilo
- ✅ Carga bajo demanda de respuestas

### 4. **Soporte para Spoilers** ✓
- ✅ Checkbox "Contiene spoilers" en formulario
- ✅ Comentarios marcados como spoiler se ocultan
- ✅ Click para revelar contenido de spoiler
- ✅ Badge visual "Spoiler" en comentarios revelados

### 5. **Soporte para Imágenes** ✓
- ✅ Hasta 4 imágenes por comentario
- ✅ Preview antes de publicar
- ✅ Grid responsivo para mostrar imágenes
- ✅ Botón para eliminar imágenes antes de publicar
- ✅ Validación de límite de imágenes

### 6. **Sistema de Notificaciones** ✓
- ✅ Trigger `trg_insert_comment` en la BD
- ✅ Notifica cuando alguien responde tu comentario
- ✅ Integración con sistema de notificaciones existente

### 7. **Historial de Comentarios** ✓
- ✅ Vista de todos los comentarios del usuario
- ✅ Información del medio donde comentó
- ✅ Enlaces directos al medio
- ✅ Para usuario, admin y moderador
- ✅ Opción de incluir comentarios eliminados (solo admin/mod)

### 8. **Funciones Completas** ✓
- ✅ **Crear** comentarios y respuestas
- ✅ **Editar** comentarios propios
- ✅ **Eliminar** comentarios propios (soft delete)
- ✅ **Like/Unlike** a comentarios
- ✅ **Ordenamiento**: Más recientes, más antiguos, más populares
- ✅ **Paginación**: Carga lazy de comentarios
- ✅ **Permisos**: Admin/Mod pueden editar/eliminar cualquier comentario

### 9. **Likes en Comentarios** ✓
- ✅ Botón de like con contador
- ✅ Toggle like/unlike
- ✅ Visual feedback (corazón relleno cuando tiene like)
- ✅ Actualización en tiempo real
- ✅ Tabla `comment_reactions` con triggers automáticos

---

## 🗄️ Estructura de Base de Datos

### Tabla: `app.comments`

```sql
CREATE TABLE app.comments (
  id BIGSERIAL PRIMARY KEY,
  commentable_type VARCHAR(20) NOT NULL,  -- anime, manga, novels, etc.
  commentable_id BIGINT NOT NULL,
  user_id BIGINT REFERENCES app.users(id),
  parent_id BIGINT REFERENCES app.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]'::jsonb,  -- Array de URLs (max 4)
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);
```

### Tabla: `app.comment_reactions`

```sql
CREATE TABLE app.comment_reactions (
  comment_id BIGINT REFERENCES app.comments(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES app.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) CHECK (reaction_type = 'like'),
  PRIMARY KEY (comment_id, user_id)
);
```

### Triggers Automáticos

1. **`trg_comment_insert`**: Crea notificación cuando alguien responde
2. **`trg_comment_insert_update_replies`**: Actualiza contador de respuestas
3. **`trg_comment_delete_update_replies`**: Actualiza al eliminar
4. **`trg_comment_reaction_insert/delete`**: Actualiza contador de likes
5. **`trg_comments_update_time`**: Actualiza `updated_at`

---

## 🛠️ APIs Implementadas

### 1. `GET /api/comments`
**Obtiene comentarios de un medio**

**Query Params:**
- `type`: Tipo de medio (anime, manga, etc.)
- `id`: ID del medio
- `parent_id`: (Opcional) ID del comentario padre para obtener respuestas
- `limit`: Límite de resultados (default: 20, max: 100)
- `offset`: Offset para paginación
- `sort`: `newest` | `oldest` | `most_liked`

**Respuesta:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "1",
      "content": "Gran anime!",
      "isSpoiler": false,
      "images": [],
      "likesCount": 5,
      "repliesCount": 2,
      "user": {
        "username": "usuario",
        "displayName": "Usuario",
        "avatarUrl": "...",
        "level": 5
      },
      "userLiked": true,
      "createdAt": "2025-10-23T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. `POST /api/comments`
**Crea un nuevo comentario**

**Body:**
```json
{
  "type": "anime",
  "id": "1",
  "content": "Excelente episodio!",
  "parent_id": null,  // o ID del comentario padre
  "is_spoiler": false,
  "images": ["url1", "url2"]
}
```

**Respuesta:**
```json
{
  "success": true,
  "commentId": "123",
  "message": "Comentario creado exitosamente"
}
```

### 3. `PATCH /api/comments/[id]`
**Edita un comentario existente**

**Permisos:** Autor, Admin o Moderador

**Body:**
```json
{
  "content": "Contenido actualizado",
  "is_spoiler": true,
  "images": ["url1"]
}
```

### 4. `DELETE /api/comments/[id]`
**Elimina un comentario (soft delete)**

**Permisos:** Autor, Admin o Moderador

### 5. `POST /api/comments/[id]/like`
**Da like o quita like a un comentario**

**Respuesta:**
```json
{
  "success": true,
  "action": "liked",  // o "unliked"
  "message": "Like agregado"
}
```

### 6. `GET /api/user/comments`
**Obtiene historial de comentarios del usuario**

**Query Params:**
- `userId`: (Opcional) ID del usuario
- `limit`: Límite de resultados
- `offset`: Offset para paginación
- `include_deleted`: (Solo admin/mod) Incluir eliminados

---

## 🧩 Componentes

### 1. `<CommentsSection>`
**Componente principal**

```tsx
<CommentsSection 
  mediaType="anime" 
  mediaId="1" 
/>
```

**Características:**
- Formulario para comentar
- Lista de comentarios con paginación
- Sistema de respuestas anidadas
- Ordenamiento
- Likes
- Edición y eliminación

### 2. `<CommentItem>`
**Comentario individual**

**Características:**
- Avatar del usuario
- Contenido con spoilers
- Imágenes
- Botones de acción (like, responder, editar, eliminar)
- Botón de respuestas

### 3. `<CommentForm>`
**Formulario de comentario/respuesta**

**Características:**
- Textarea con contador
- Checkbox de spoiler
- Subida de imágenes (max 4)
- Preview de imágenes
- Validaciones

### 4. `<UserCommentsHistory>`
**Historial de comentarios**

```tsx
<UserCommentsHistory 
  userId={3} 
  showDeleteButton={true} 
/>
```

**Características:**
- Lista de todos los comentarios del usuario
- Información del medio
- Enlaces directos
- Opción de eliminar

---

## 📱 Uso en Páginas

### En una página de anime/manga/etc:

```tsx
// src/app/anime/[id]/page.tsx
import { CommentsSection } from '@/components/comments';

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div>
      {/* ... Contenido del anime ... */}
      
      <CommentsSection mediaType="anime" mediaId={id} />
    </div>
  );
}
```

### En el perfil del usuario:

```tsx
// src/app/profile/page.tsx
import { UserCommentsHistory } from '@/components/user-comments-history';

export default function ProfilePage() {
  return (
    <div>
      <UserCommentsHistory />
    </div>
  );
}
```

---

## 🔐 Seguridad y Permisos

### Matriz de Permisos:

| Acción | Usuario | Autor | Moderador | Admin |
|--------|---------|-------|-----------|-------|
| Ver comentarios | ✅ | ✅ | ✅ | ✅ |
| Crear comentario | ✅ | ✅ | ✅ | ✅ |
| Dar like | ✅ | ✅ | ✅ | ✅ |
| Editar propio | ❌ | ✅ | ✅ | ✅ |
| Editar ajeno | ❌ | ❌ | ✅ | ✅ |
| Eliminar propio | ❌ | ✅ | ✅ | ✅ |
| Eliminar ajeno | ❌ | ❌ | ✅ | ✅ |

### Validaciones:

- ✅ Contenido mínimo: 1 carácter
- ✅ Contenido máximo: 5000 caracteres
- ✅ Máximo de imágenes: 4
- ✅ Verificación de existencia del medio
- ✅ Verificación de existencia del comentario padre
- ✅ Autenticación requerida para crear/editar/eliminar
- ✅ Soft delete para mantener historial

---

## 🎨 Características UX

1. **Feedback visual**:
   - Loading spinners
   - Toast notifications
   - Estados de hover
   - Animaciones suaves

2. **Responsive**:
   - Funciona en móvil y desktop
   - Grid adaptativo para imágenes
   - Botones adaptados al tamaño

3. **Accesibilidad**:
   - Labels semánticos
   - Aria labels
   - Keyboard navigation

4. **Performance**:
   - Carga lazy de respuestas
   - Paginación
   - Optimistic UI updates

---

## 📊 Estadísticas y Contadores

El sistema mantiene automáticamente:

- ✅ `likes_count` en cada comentario
- ✅ `replies_count` en comentarios con respuestas
- ✅ Total de comentarios por medio
- ✅ Actualización en tiempo real vía triggers

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras:

1. **Menciones**: @usuario en comentarios
2. **Emojis/Reacciones**: Más tipos además de like
3. **Markdown**: Soporte para formato rico
4. **Moderación**: Sistema de reportes de comentarios
5. **Edición de imágenes**: Recorte y filtros
6. **Búsqueda**: Buscar en comentarios
7. **Notificaciones push**: Real-time con WebSockets
8. **Comentarios fijados**: Pin de comentarios importantes

---

## 📝 Notas de Implementación

### Migración Ejecutada:
```sql
-- database/migrations/add_images_to_comments.sql
ALTER TABLE app.comments ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
CREATE INDEX idx_comments_with_images ON app.comments ((jsonb_array_length(images) > 0));
ALTER TABLE app.comments ADD CONSTRAINT check_images_max_count CHECK (jsonb_array_length(images) <= 4);
```

### Archivos Creados:
- ✅ `src/app/api/comments/route.ts` (GET, POST)
- ✅ `src/app/api/comments/[id]/route.ts` (PATCH, DELETE)
- ✅ `src/app/api/comments/[id]/like/route.ts` (POST)
- ✅ `src/app/api/user/comments/route.ts` (GET)
- ✅ `src/components/comments/comments-section.tsx`
- ✅ `src/components/comments/comment-item.tsx`
- ✅ `src/components/comments/comment-form.tsx`
- ✅ `src/components/comments/index.ts`
- ✅ `src/components/user-comments-history.tsx`
- ✅ Tipos añadidos a `src/lib/types.ts`

### Dependencias Usadas:
- `date-fns`: Formateo de fechas relativas
- `lucide-react`: Iconos
- Componentes UI existentes (shadcn/ui)

---

## ✅ Checklist de Completitud

- [x] Comentarios por tipo de medio (7 tipos)
- [x] Comentarios únicos por medio
- [x] Sistema de respuestas anidadas
- [x] Soporte para spoilers
- [x] Soporte para imágenes (hasta 4)
- [x] Sistema de notificaciones
- [x] Historial de comentarios
- [x] Funciones completas (CRUD)
- [x] Sistema de likes
- [x] APIs RESTful
- [x] Componentes React
- [x] Permisos y seguridad
- [x] UX responsive
- [x] Documentación

---

## 🎯 Conclusión

El sistema de comentarios está **100% funcional** y cumple con todos los requisitos especificados. Es escalable, seguro, y proporciona una excelente experiencia de usuario.

**Estado:** ✅ **COMPLETADO Y LISTO PARA PRODUCCIÓN**
