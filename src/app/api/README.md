# 📡 API Routes - Chirisu

Documentación completa de todos los endpoints de la API REST del proyecto Chirisu.
Basado en Next.js 15 App Router con Route Handlers.

---

## 📂 Estructura General

```
src/app/api/
├── 🔐 auth/                 # Autenticación y sesión
├── 👤 user/                 # Datos del usuario actual
├── 👥 users/                # Usuarios públicos
├── 🛡️ admin/                # Endpoints de administrador
├── 🔧 moderation/           # Endpoints de moderación
│
├── 📺 anime/                # CRUD Anime
├── 📖 manga/                # CRUD Manga
├── 🎬 donghua/              # CRUD Donghua
├── 📕 manhua/               # CRUD Manhua
├── 📗 manhwa/               # CRUD Manhwa
├── 🎨 fan-comics/           # CRUD Fan Comics
├── 🎬 media/                # Media genérico
│
├── 👤 characters/           # Personajes
├── 👔 staff/                # Staff (directores, etc.)
├── 🎤 voice-actors/         # Actores de voz
├── 🏢 studios/              # Estudios de animación
├── 🏷️ genres/               # Géneros
│
├── 💬 comments/             # Sistema de comentarios
├── ⭐ reviews/              # Sistema de reseñas
├── ❤️ favorites/            # Favoritos
├── 📋 lists/                # Listas públicas
│
├── ✨ contributions/        # Contribuciones (nuevo contenido)
├── 📝 content-contributions/# Ediciones de contenido
│
├── 🚨 reports/              # Reportes generales
├── 🚨 comment-reports/      # Reportes de comentarios
├── 🚨 review-reports/       # Reportes de reseñas
├── 🚨 user-reports/         # Reportes de usuarios
├── 🚨 content-reports/      # Reportes de contenido
│
├── 🔍 search/               # Búsqueda global
├── 📚 catalog/              # Catálogo con filtros
├── 🏆 rankings/             # Rankings
├── 📅 upcoming/             # Próximos estrenos
├── 🎬 trailers/             # Trailers
│
├── 📖 scan/                 # Sistema de Scanlation/Fansub
│
├── ⏰ cron/                 # Tareas programadas
├── 🐛 debug/                # Endpoints de debug
└── 🧪 test-db/              # Test de conexión BD
```

---

## 🔐 Autenticación (`/api/auth/`)

### Sesión y Login

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ |
| GET | `/api/auth/session` | Obtener sesión actual | ❌ |
| POST | `/api/auth/register` | Registrar nueva cuenta | ❌ |
| POST | `/api/auth/verify-registration` | Verificar email de registro | ❌ |

### Recuperación de Contraseña

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña | ❌ |
| POST | `/api/auth/recover-password` | Validar token de recuperación | ❌ |
| POST | `/api/auth/reset-password` | Establecer nueva contraseña | ❌ |

### Two-Factor Authentication (2FA)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| POST | `/api/auth/2fa/setup` | Generar QR y códigos backup | ✅ |
| POST | `/api/auth/2fa/enable` | Activar 2FA | ✅ |
| POST | `/api/auth/2fa/verify` | Verificar código TOTP | ❌ |
| POST | `/api/auth/2fa/disable` | Desactivar 2FA | ✅ |
| GET | `/api/auth/get-pending-2fa` | Obtener 2FA pendiente (login) | ❌ |

---

## 👤 Usuario Actual (`/api/user/`)

### Perfil

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/profile` | Obtener mi perfil completo | ✅ |
| PUT | `/api/user/profile` | Actualizar mi perfil | ✅ |
| GET | `/api/user/profile/[username]` | Obtener perfil de otro usuario | ❌ |
| PUT | `/api/user/change-password` | Cambiar mi contraseña | ✅ |
| GET | `/api/user/export` | Exportar mis datos (GDPR) | ✅ |

### Listas del Usuario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/lists` | Obtener mis listas (watching, completed, etc.) | ✅ |
| POST | `/api/user/lists` | Agregar media a lista | ✅ |
| GET | `/api/user/lists/[listId]` | Obtener lista específica | ✅ |
| PUT | `/api/user/lists/settings` | Configuración de listas | ✅ |
| GET | `/api/user/lists/[listId]/items` | Items de una lista | ✅ |
| POST | `/api/user/lists/[listId]/items` | Agregar item a lista | ✅ |
| DELETE | `/api/user/lists/[listId]/items/[itemId]` | Quitar item de lista | ✅ |

### Listas Personalizadas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/custom-lists` | Obtener listas personalizadas | ✅ |
| POST | `/api/user/custom-lists` | Crear lista personalizada | ✅ |

### Favoritos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/favorites` | Obtener mis favoritos | ✅ |
| POST | `/api/user/favorites` | Agregar a favoritos | ✅ |
| DELETE | `/api/user/favorites` | Quitar de favoritos | ✅ |

### Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/notifications` | Obtener notificaciones | ✅ |
| PUT | `/api/user/notifications/[id]` | Marcar como leída | ✅ |
| GET | `/api/user/notifications/history` | Historial completo | ✅ |

### Reseñas del Usuario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/reviews` | Mis reseñas | ✅ |
| PUT | `/api/user/reviews/[reviewId]` | Editar mi reseña | ✅ |
| DELETE | `/api/user/reviews/[reviewId]` | Eliminar mi reseña | ✅ |
| POST | `/api/user/reviews/[reviewId]/vote` | Votar reseña (útil/no útil) | ✅ |

### Comentarios e Historial

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/comments` | Historial de comentarios | ✅ |
| GET | `/api/user/contributions` | Mis contribuciones | ✅ |
| GET | `/api/user/reports` | Mis reportes enviados | ✅ |
| GET | `/api/user/comment-reports` | Mis reportes de comentarios | ✅ |

---

## 👥 Usuarios Públicos (`/api/users/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/users/top-active` | Top usuarios más activos | ❌ |

---

## 🛡️ Administración (`/api/admin/`)

> **Requiere rol:** `admin`

### Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/dashboard-stats` | Estadísticas del dashboard |
| GET | `/api/admin/top-contributors` | Top contribuidores |
| GET | `/api/admin/search` | Búsqueda avanzada de contenido |
| GET | `/api/admin/search-media` | Búsqueda de media para edición |

### Gestión de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/users` | Listar usuarios |
| PUT | `/api/admin/users` | Actualizar usuario (roles, ban) |

### Gestión de Media

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/media/[type]/[id]` | Obtener media para editar |
| PUT | `/api/admin/media/[type]/[id]` | Editar media directamente |
| DELETE | `/api/admin/media/[type]/[id]` | Eliminar media |
| GET | `/api/admin/media/[type]/[id]/relations` | Relaciones de media |

### Moderación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/reported-comments` | Comentarios reportados |
| PUT | `/api/admin/reported-comments` | Resolver reporte de comentario |

---

## 🔧 Moderación (`/api/moderation/`)

> **Requiere rol:** `moderator` o `admin`

### Contribuciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/moderation/contributions` | Contribuciones para revisar |
| GET | `/api/moderation/contributions/[id]` | Detalle de contribución |
| PUT | `/api/moderation/contributions/[id]` | Aprobar/rechazar contribución |
| POST | `/api/moderation/contributions/[id]/assign` | Tomar caso (asignar a mí) |
| DELETE | `/api/moderation/contributions/[id]/assign` | Liberar caso |

### Reportes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/moderation/reported-reviews` | Reviews reportadas |
| PUT | `/api/moderation/reported-reviews` | Resolver reporte de review |

---

## 📺 Media - Anime (`/api/anime/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/anime/[id]` | Obtener detalle de anime | ❌ |
| GET | `/api/anime/[id]/characters` | Personajes del anime | ❌ |
| GET | `/api/anime/[id]/episodes` | Episodios del anime | ❌ |
| GET | `/api/anime/[id]/staff` | Staff del anime | ❌ |
| GET | `/api/anime/[id]/studios` | Estudios del anime | ❌ |

---

## 📖 Media - Manga (`/api/manga/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/manga/[id]` | Obtener detalle de manga | ❌ |

---

## 🎬 Otros Tipos de Media

| Endpoint | Descripción |
|----------|-------------|
| `/api/donghua` | Donghua (animación china) |
| `/api/manhua` | Manhua (comics chinos) |
| `/api/manhwa` | Manhwa (comics coreanos) |
| `/api/fan-comics` | Fan comics |

> Todos siguen la misma estructura que `/api/anime/`

---

## 🎬 Media Genérico (`/api/media/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/media` | Listar media (con filtros) | ❌ |
| GET | `/api/media/[id]` | Obtener media por ID | ❌ |
| GET | `/api/media/extract-color` | Extraer color dominante de imagen | ❌ |

### Query Parameters para `/api/media`:
```
?type=anime|manga|novel|donghua|manhua|manhwa|fan_comic
&status=airing|completed|upcoming
&genre=action,comedy
&year=2024
&sort=score|popularity|title
&order=asc|desc
&page=1
&limit=20
```

---

## 👤 Entidades

### Personajes (`/api/characters/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/characters` | Listar/buscar personajes | ❌ |
| POST | `/api/characters` | Crear personaje nuevo | ✅ |
| GET | `/api/characters/all` | Todos los personajes | ❌ |

### Staff (`/api/staff/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/staff` | Listar/buscar staff | ❌ |
| GET | `/api/staff/all` | Todo el staff | ❌ |

### Actores de Voz (`/api/voice-actors/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/voice-actors` | Listar/buscar actores | ❌ |
| POST | `/api/voice-actors` | Crear actor de voz | ✅ |
| GET | `/api/voice-actors/all` | Todos los actores | ❌ |

### Estudios (`/api/studios/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/studios` | Listar estudios | ❌ |

### Géneros (`/api/genres/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/genres` | Listar géneros | ❌ |

### Búsqueda para Contribuciones (`/api/search/`)

Endpoints específicos para búsqueda en formularios de contribución.

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/search/staff` | Buscar staff por nombre | ❌ |
| POST | `/api/search/staff` | Crear nuevo staff | ✅ |
| GET | `/api/search/studios` | Buscar estudios por nombre | ❌ |
| POST | `/api/search/studios` | Crear nuevo estudio | ✅ |

---

## 🎬 Media Detallada (`/api/media/`)

### Detalles de Media (`/api/media/details/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/media/details/[id]` | Obtener detalles completos de media | ❌ |

**Query Parameters:**
```
?type=anime|manga|donghua|manhwa|manhua|novel|fan_comic
```

### Personajes y Staff por Tipo (`/api/media/[type]/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/media/[type]/[id]/characters` | Personajes de cualquier media | ❌ |
| GET | `/api/media/[type]/[id]/staff` | Staff de cualquier media | ❌ |

**Tipos soportados:** `anime`, `manga`, `donghua`, `manhwa`, `manhua`, `novel`, `fan_comic`

---

## 💬 Comentarios (`/api/comments/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/comments` | Obtener comentarios | ❌ |
| POST | `/api/comments` | Crear comentario | ✅ |
| PUT | `/api/comments/[id]` | Editar comentario | ✅ |
| DELETE | `/api/comments/[id]` | Eliminar comentario | ✅ |
| POST | `/api/comments/[id]/like` | Dar like a comentario | ✅ |
| POST | `/api/comments/[id]/react` | Reaccionar a comentario | ✅ |
| POST | `/api/comments/[id]/report` | Reportar comentario | ✅ |

### Query Parameters para GET `/api/comments`:
```
?mediaType=anime|manga|...
&mediaId=123
&sort=newest|oldest|popular
&page=1
&limit=20
```

---

## ⭐ Reseñas (`/api/reviews/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/reviews/[id]` | Obtener reseña | ❌ |
| POST | `/api/reviews/[id]` | Crear reseña | ✅ |
| PUT | `/api/reviews/[id]` | Editar reseña | ✅ |
| DELETE | `/api/reviews/[id]` | Eliminar reseña | ✅ |
| POST | `/api/reviews/[id]/report` | Reportar reseña | ✅ |

---

## ❤️ Favoritos (`/api/favorites/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/favorites` | Obtener favoritos públicos | ❌ |
| POST | `/api/favorites` | Agregar a favoritos | ✅ |
| PUT | `/api/favorites/privacy` | Cambiar privacidad | ✅ |

---

## 📋 Listas Públicas (`/api/lists/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/lists/[listId]` | Obtener lista pública | ❌ |
| PUT | `/api/lists/[listId]/privacy` | Cambiar privacidad | ✅ |

---

## ✨ Contribuciones - Nuevo Contenido (`/api/contributions/`)

Sistema para contribuir NUEVO contenido (anime, personajes, etc.)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| POST | `/api/contributions/submit-media` | Enviar nuevo media | ✅ |
| POST | `/api/contributions/submit-entity` | Enviar nueva entidad | ✅ |
| GET | `/api/contributions/[id]` | Obtener contribución | ✅ |
| POST | `/api/contributions/[id]/assign` | Asignar a moderador | 🔧 |

### Body para submit-media:
```json
{
  "type": "anime",
  "title": "Nuevo Anime",
  "synopsis": "...",
  "genres": ["action", "comedy"],
  "status": "airing",
  // ... más campos
}
```

---

## 📝 Contribuciones - Ediciones (`/api/content-contributions/`)

Sistema para EDITAR contenido existente.

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/content-contributions` | Listar contribuciones | ✅ |
| POST | `/api/content-contributions` | Enviar edición | ✅ |
| GET | `/api/content-contributions/[id]` | Obtener edición | ✅ |
| PUT | `/api/content-contributions/[id]` | Aprobar/rechazar | 🔧 |
| POST | `/api/content-contributions/[id]/assign` | Tomar caso | 🔧 |
| DELETE | `/api/content-contributions/[id]/assign` | Liberar caso | 🔧 |

### Query Parameters para GET:
```
?status=pending|in_review|approved|rejected
&mediaType=anime|manga|...
&currentUserId=123    # Para filtro de moderador
&isAdmin=true         # Si es admin ve todo
```

### Body para POST (crear edición):
```json
{
  "media_type": "anime",
  "media_id": 123,
  "field_changes": {
    "title": { "old": "Naruto", "new": "Naruto Shippuden" },
    "synopsis": { "old": "...", "new": "..." }
  }
}
```

### Body para PUT (aprobar/rechazar):
```json
{
  "status": "approved" | "rejected",
  "rejection_reason": "Información incorrecta" // Solo si rejected
}
```

---

## 🚨 Sistema de Reportes

### Reportes de Comentarios (`/api/comment-reports/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/comment-reports` | Listar reportes | 🔧 |
| POST | `/api/comment-reports` | Crear reporte | ✅ |
| GET | `/api/comment-reports/[id]` | Detalle de reporte | 🔧 |
| PUT | `/api/comment-reports/[id]` | Resolver reporte | 🔧 |

### Reportes de Reseñas (`/api/review-reports/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/review-reports` | Listar reportes | 🔧 |
| POST | `/api/review-reports` | Crear reporte | ✅ |
| GET | `/api/review-reports/[id]` | Detalle de reporte | 🔧 |
| PUT | `/api/review-reports/[id]` | Resolver reporte | 🔧 |

### Reportes de Usuarios (`/api/user-reports/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user-reports` | Listar reportes | 🔧 |
| POST | `/api/user-reports` | Crear reporte | ✅ |
| GET | `/api/user-reports/[id]` | Detalle de reporte | 🔧 |
| PUT | `/api/user-reports/[id]` | Resolver reporte | 🔧 |

### Reportes de Contenido (`/api/content-reports/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/content-reports` | Listar reportes | 🔧 |
| POST | `/api/content-reports` | Crear reporte | ✅ |
| GET | `/api/content-reports/[id]` | Detalle de reporte | 🔧 |
| PUT | `/api/content-reports/[id]` | Resolver reporte | 🔧 |

### Contadores de Reportes (`/api/reports/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/reports/counts` | Contadores por tipo | 🔧 |

---

## 🔍 Búsqueda y Catálogo

### Búsqueda Global (`/api/search/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/search` | Búsqueda global | ❌ |

```
?q=naruto
&type=anime|manga|character|staff|voice_actor
&limit=10
```

### Catálogo (`/api/catalog/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/catalog` | Catálogo con filtros | ❌ |

```
?type=anime
&genre=action
&year=2024
&status=airing
&sort=score
&page=1
```

### Media por Género (`/api/media-by-genre/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/media-by-genre` | Media agrupado por género | ❌ |

### Obtener Media para Edición (`/api/get-media-for-edit/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/get-media-for-edit` | Datos completos para editar | ✅ |

```
?type=anime&id=123
```

---

## 🏆 Rankings y Contenido Destacado

### Rankings (`/api/rankings/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/rankings` | Rankings por categoría | ❌ |

```
?type=anime|manga|...
&category=score|popularity|trending
&limit=10
```

### Próximos Estrenos (`/api/upcoming/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/upcoming` | Próximos estrenos | ❌ |

### Trailers (`/api/trailers/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/trailers` | Trailers recientes | ❌ |

---

## 📖 Scanlation/Fansub (`/api/scan/`)

> **Requiere rol:** `scan` o `admin`

Sistema para que scanlators/fansubbers gestionen sus proyectos de traducción.

### Proyectos (`/api/scan/projects/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/scan/projects` | Listar proyectos (filtra por userId, mediaType, etc.) | ❌ |
| POST | `/api/scan/projects` | Crear nuevo proyecto | 📖 |
| GET | `/api/scan/projects/[id]` | Obtener proyecto con capítulos | ❌ |
| PUT | `/api/scan/projects/[id]` | Actualizar proyecto (status, links) | 📖 |
| DELETE | `/api/scan/projects/[id]` | Eliminar proyecto | 📖 |

### Query Parameters para GET `/api/scan/projects`:
```
?userId=123            # Proyectos de un usuario
&mediaType=manga       # Filtrar por tipo
&mediaId=456           # Proyectos de un media específico
&status=active         # active, hiatus, completed, dropped, licensed
&language=es           # Idioma de traducción
```

### Capítulos (`/api/scan/projects/[id]/chapters/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/scan/projects/[id]/chapters` | Listar capítulos del proyecto | ❌ |
| POST | `/api/scan/projects/[id]/chapters` | Agregar capítulo | 📖 |
| GET | `/api/scan/projects/[id]/chapters/[chapterId]` | Detalle de capítulo | ❌ |
| PUT | `/api/scan/projects/[id]/chapters/[chapterId]` | Actualizar capítulo | 📖 |
| DELETE | `/api/scan/projects/[id]/chapters/[chapterId]` | Eliminar capítulo | 📖 |

### Body para POST proyecto:
```json
{
  "mediaType": "manga",
  "mediaId": 123,
  "groupName": "MangaDex Scans",
  "websiteUrl": "https://ejemplo.com",
  "projectUrl": "https://ejemplo.com/manga/123",
  "language": "es",
  "notes": "Traducción semanal"
}
```

### Body para POST capítulo:
```json
{
  "chapterNumber": 10.5,
  "volumeNumber": 2,
  "title": "El comienzo",
  "chapterUrl": "https://ejemplo.com/manga/123/10.5",
  "releaseDate": "2025-01-01T12:00:00Z"
}
```

### Estados de Proyecto:
- `active` - Traduciendo activamente
- `hiatus` - En pausa temporal
- `completed` - Proyecto completado
- `dropped` - Abandonado
- `licensed` - Licenciado (debe dejar de traducir)

### Rol de Usuario (`/api/user/[id]/role/`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| GET | `/api/user/[id]/role` | Obtener rol y permisos de un usuario | ❌ |

---

## ⏰ Tareas Programadas (`/api/cron/`)

> Endpoints para tareas automáticas (cron jobs)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/cron/refresh-rankings` | Actualizar rankings |

---

## 🐛 Debug y Testing

### Debug (`/api/debug/`)

> Solo disponible en desarrollo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/debug` | Información de debug |

### Test DB (`/api/test-db/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/test-db` | Probar conexión a BD |

---

## 🔐 Leyenda de Autenticación

| Símbolo | Significado |
|:-------:|-------------|
| ❌ | No requiere autenticación |
| ✅ | Requiere usuario autenticado |
| 🔧 | Requiere rol `moderator` o `admin` |
| 🛡️ | Requiere rol `admin` |
| 📖 | Requiere rol `scan` o `admin` |

---

## 📊 Respuestas Estándar

### Éxito
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

### Paginación
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 📈 Códigos de Estado HTTP

| Código | Uso |
|--------|-----|
| 200 | Éxito |
| 201 | Creado exitosamente |
| 400 | Bad Request - datos inválidos |
| 401 | No autenticado |
| 403 | No autorizado (sin permisos) |
| 404 | No encontrado |
| 409 | Conflicto (duplicado) |
| 500 | Error del servidor |

---

## 📊 Estadísticas

| Categoría | Endpoints |
|-----------|-----------|
| Autenticación | 12 |
| Usuario actual | 23 |
| Administración | 8 |
| Moderación | 6 |
| Media (todos los tipos) | 15 |
| Media detallada (details, characters, staff) | 4 |
| Entidades (characters, staff, VA, studios) | 12 |
| Búsqueda para contribuciones | 4 |
| Social (comments, reviews) | 12 |
| Contribuciones | 8 |
| Reportes | 16 |
| Búsqueda y catálogo | 6 |
| Rankings y contenido | 3 |
| Scanlation/Fansub | 7 |
| Otros | 3 |

**Total: ~139 endpoints**

---

## 🚀 Convenciones

### Nomenclatura:
- Rutas en `kebab-case`: `/api/content-contributions`
- Parámetros dinámicos: `[id]`, `[type]`, `[username]`
- Plurales para colecciones: `/api/comments`, `/api/reviews`

### Métodos HTTP:
- `GET` - Leer datos
- `POST` - Crear nuevo recurso
- `PUT` - Actualizar recurso completo
- `PATCH` - Actualización parcial
- `DELETE` - Eliminar recurso

### Headers requeridos:
```
Content-Type: application/json
Authorization: Bearer <token>  (si requiere auth)
```

---

**Última actualización:** 29 de Noviembre, 2025  
**Autor:** Equipo Chirisu
