# 📊 Estructura Completa de Base de Datos - Chirisu

> **Base de Datos:** `bd_chirisu`  
> **Schema:** `app`  
> **DBMS:** PostgreSQL 17  
> **Fecha de Documentación:** 31 de Octubre, 2025

---

## 📑 Tabla de Contenidos

1. [Tablas de Medios](#tablas-de-medios)
2. [Tablas de Usuarios y Autenticación](#tablas-de-usuarios-y-autenticación)
3. [Tablas de Interacción Social](#tablas-de-interacción-social)
4. [Tablas de Contenido y Metadata](#tablas-de-contenido-y-metadata)
5. [Tablas de Sistema](#tablas-de-sistema)
6. [Vistas](#vistas)
7. [Patrones Polimórficos](#patrones-polimórficos)
8. [IDs Externos](#ids-externos)

---

## 📺 Tablas de Medios

### 1. `app.anime`

**Descripción:** Tabla principal para contenido de anime japonés.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `created_by` | `integer` | NULL | | Usuario creador |
| `updated_by` | `integer` | NULL | | Último usuario que actualizó |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Última actualización |
| `mal_id` | `bigint` | NULL | | ID en MyAnimeList |
| `anilist_id` | `bigint` | NULL | | ID en AniList |
| `kitsu_id` | `bigint` | NULL | | ID en Kitsu |
| `title_native` | `varchar(500)` | NULL | | Título en japonés |
| `title_romaji` | `varchar(500)` | NOT NULL | | Título romanizado |
| `title_english` | `varchar(500)` | NULL | | Título en inglés |
| `title_spanish` | `varchar(500)` | NULL | | Título en español |
| `synopsis` | `text` | NULL | | Sinopsis |
| `episode_count` | `integer` | NULL | | Número de episodios |
| `duration` | `integer` | NULL | | Duración por episodio (min) |
| `start_date` | `date` | NULL | | Fecha de inicio |
| `end_date` | `date` | NULL | | Fecha de finalización |
| `cover_image_url` | `varchar(800)` | NULL | | URL de portada |
| `banner_image_url` | `varchar(800)` | NULL | | URL de banner |
| `trailer_url` | `varchar(500)` | NULL | | URL del tráiler |
| `status_id` | `integer` | NULL | | FK a `media_statuses` |
| `season` | `varchar(20)` | NULL | | Temporada (Winter, Spring, etc.) |
| `season_year` | `integer` | NULL | | Año de emisión |
| `source` | `varchar(100)` | NULL | | Fuente original (Manga, Light Novel, etc.) |
| `type` | `varchar(20)` | NULL | | Tipo: TV, Movie, OVA, ONA, Special |
| `average_score` | `numeric(4,2)` | NULL | `0` | Puntuación promedio |
| `mean_score` | `numeric(4,2)` | NULL | | Puntuación media |
| `popularity` | `integer` | NULL | `0` | Índice de popularidad |
| `favourites` | `integer` | NULL | `0` | Cantidad de favoritos |
| `ratings_count` | `integer` | NULL | `0` | Total de calificaciones |
| `ranking` | `integer` | NULL | `0` | Posición en ranking |
| `country_of_origin` | `varchar(10)` | NULL | `'JP'` | País de origen |
| `is_nsfw` | `boolean` | NULL | `false` | Contenido adulto |
| `external_payload` | `jsonb` | NULL | | Datos externos (JSON) |
| `preferences` | `jsonb` | NULL | | Preferencias (JSON) |
| `is_approved` | `boolean` | NULL | `false` | Aprobado por moderador |
| `is_published` | `boolean` | NULL | `true` | Publicado |
| `slug` | `varchar(255)` | NULL | | URL amigable única |
| `deleted_at` | `timestamptz` | NULL | | Soft delete |

**Índices:**
- `anime_pkey` (PRIMARY KEY)
- `anime_slug_key` (UNIQUE)
- `anime_mal_id_key`, `anime_anilist_id_key`, `anime_kitsu_id_key` (UNIQUE)
- `idx_anime_favourites`, `idx_anime_popularity`, `idx_anime_ranking_score`
- `idx_anime_title_search` (GIN - Full text search)
- `idx_anime_season_year`

**Constraints:**
- `anime_type_check`: Tipo debe ser TV, Movie, OVA, ONA, Special, Music

**Foreign Keys:**
- `anime_created_by_fkey` → `users(id)`
- `anime_updated_by_fkey` → `users(id)`
- `anime_status_id_fkey` → `media_statuses(id)`

**Triggers:**
- `trg_anime_update_popularity` - Actualiza popularidad
- `trg_anime_update_ranking` - Actualiza ranking
- `trg_anime_update_time` - Actualiza `updated_at`
- `trg_set_anime_slug` - Genera slug único
- `trg_set_anime_status_default` - Establece estado por defecto

---

### 2. `app.manga`

**Descripción:** Tabla para manga japonés.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `created_by` | `integer` | NULL | | Usuario creador |
| `updated_by` | `integer` | NULL | | Último usuario que actualizó |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Última actualización |
| `mal_id` | `bigint` | NULL | | ID en MyAnimeList |
| `anilist_id` | `bigint` | NULL | | ID en AniList |
| `kitsu_id` | `bigint` | NULL | | ID en Kitsu |
| `title_native` | `varchar(500)` | NULL | | Título nativo |
| `title_romaji` | `varchar(500)` | NOT NULL | | Título romanizado |
| `title_english` | `varchar(500)` | NULL | | Título en inglés |
| `title_spanish` | `varchar(500)` | NULL | | Título en español |
| `synopsis` | `text` | NULL | | Sinopsis |
| `volumes` | `integer` | NULL | | Número de volúmenes |
| `chapters` | `integer` | NULL | | Número de capítulos |
| `cover_image_url` | `varchar(800)` | NULL | | URL de portada |
| `banner_image_url` | `varchar(800)` | NULL | | URL de banner |
| `status_id` | `integer` | NULL | | FK a `media_statuses` |
| `source` | `varchar(100)` | NULL | | Fuente original |
| `type` | `varchar(20)` | NULL | | Tipo: Manga, Manhwa, Manhua, One-shot |
| `average_score` | `numeric(4,2)` | NULL | `0` | Puntuación promedio |
| `mean_score` | `numeric(4,2)` | NULL | | Puntuación media |
| `popularity` | `integer` | NULL | `0` | Índice de popularidad |
| `favourites` | `integer` | NULL | `0` | Cantidad de favoritos |
| `ratings_count` | `integer` | NULL | `0` | Total de calificaciones |
| `start_date` | `date` | NULL | | Fecha de inicio publicación |
| `end_date` | `date` | NULL | | Fecha de fin |
| `country_of_origin` | `varchar(10)` | NULL | | País de origen |
| `is_nsfw` | `boolean` | NULL | `false` | Contenido adulto |
| `external_payload` | `jsonb` | NULL | | Datos externos |
| `is_approved` | `boolean` | NULL | `false` | Aprobado |
| `deleted_at` | `timestamptz` | NULL | | Soft delete |
| `slug` | `varchar(255)` | NULL | | URL amigable |
| `ranking` | `integer` | NULL | `0` | Posición ranking |

**Índices:** Similar a anime
**Constraints:** `manga_type_check` - Manga, Manhwa, Manhua, One-shot
**Triggers:** Similar a anime

---

### 3. `app.novels`

**Descripción:** Tabla para novelas ligeras y web novels.

**Estructura:** Idéntica a `manga` pero con `type_check`:
- Light_Novel
- Web_Novel  
- Novel

---

### 4. `app.donghua`

**Descripción:** Animación china (donghua).

**Diferencias clave con anime:**
- `country_of_origin`: Default `'CN'`
- Misma estructura que `anime` (tiene `episode_count`, NO tiene `volumes`/`chapters`)

---

### 5. `app.manhua`

**Descripción:** Cómic chino.

**Diferencias clave:**
- `country_of_origin`: Default `'CN'`
- `type`: Default `'Manhua'`
- Tiene `volumes` y `chapters`
- `type_check`: Manhua, Web Manhua, One-shot

---

### 6. `app.manhwa`

**Descripción:** Cómic coreano / Webtoon.

**Diferencias clave:**
- `country_of_origin`: Default `'KR'`
- `type`: Default `'Manhwa'`
- Tiene `volumes` y `chapters`
- `type_check`: Manhwa, Webtoon, One-shot

---

### 7. `app.fan_comics`

**Descripción:** Cómics creados por fans (doujinshi, fan art).

**⚠️ IMPORTANTE - Estructura diferente:**

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | `bigint` | NOT NULL | `nextval()` | |
| `title` | `varchar(500)` | NOT NULL | | ⚠️ NO tiene `title_romaji` ni `title_native` |
| `title_english` | `varchar(500)` | NULL | | |
| `title_spanish` | `varchar(500)` | NULL | | |
| `chapters` | `integer` | NULL | | ⚠️ Tiene `chapters` pero NO `volumes` |
| `type` | `varchar(20)` | NULL | `'Fan Comic'` | |

**NO tiene:**
- ❌ `title_native`
- ❌ `title_romaji`
- ❌ `volumes`
- ❌ `mal_id`, `anilist_id`, `kitsu_id` (no están en APIs externas)

**type_check:** Fan Comic, Doujinshi, Web Comic

---

## 👤 Tablas de Usuarios y Autenticación

### 8. `app.users`

**Descripción:** Tabla principal de usuarios del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `uuid` | `uuid` | NOT NULL | `uuid_generate_v4()` | UUID público |
| `email` | `varchar(320)` | NOT NULL | | Email único |
| `password_hash` | `varchar(255)` | NOT NULL | | Hash de contraseña |
| `username` | `varchar(80)` | NOT NULL | | Nombre de usuario único |
| `display_name` | `varchar(120)` | NULL | | Nombre para mostrar |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Fecha registro |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Última actualización |
| `date_of_birth` | `date` | NULL | | Fecha nacimiento |
| `nationality_code` | `char(2)` | NULL | | Código país (ISO) |
| `nationality_name` | `varchar(100)` | NULL | | Nombre del país |
| `nationality_flag_url` | `varchar(500)` | NULL | | URL bandera |
| `bio` | `varchar(200)` | NULL | | Biografía corta |
| `avatar_url` | `varchar(500)` | NULL | | Avatar del usuario |
| `banner_url` | `varchar(500)` | NULL | | Banner de perfil |
| `points` | `bigint` | NOT NULL | `0` | Puntos acumulados |
| `reputation_score` | `bigint` | NOT NULL | `0` | Reputación |
| `level` | `integer` | NOT NULL | `1` | Nivel del usuario |
| `contributions_count` | `integer` | NOT NULL | `0` | Contribuciones totales |
| `saves_count` | `integer` | NOT NULL | `0` | Items guardados |
| `followers_count` | `integer` | NOT NULL | `0` | Seguidores |
| `following_count` | `integer` | NOT NULL | `0` | Siguiendo |
| `is_active` | `boolean` | NULL | `true` | Usuario activo |
| `locale` | `varchar(10)` | NULL | `'es-CL'` | Idioma preferido |
| `deleted_at` | `timestamptz` | NULL | | Soft delete |

**Índices:**
- `users_pkey` (PRIMARY KEY)
- `users_email_key`, `users_username_key` (UNIQUE)
- `idx_users_uuid`, `idx_users_email`, `idx_users_username`

**Triggers:**
- `trg_recalc_level` - Recalcula nivel según puntos
- `trg_users_update_time` - Actualiza timestamp

---

### 9. `app.user_roles`

**Descripción:** Asignación de roles a usuarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | `bigint` | FK a users |
| `role_id` | `integer` | FK a roles |
| `assigned_by` | `integer` | Usuario que asignó |
| `assigned_at` | `timestamptz` | Fecha asignación |

---

### 10. `app.roles`

**Descripción:** Definición de roles del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `name` | `varchar(50)` | Nombre del rol |
| `description` | `text` | Descripción |

**Roles típicos:** Admin, Moderator, User, Contributor, etc.

---

### 11. `app.permissions`

**Descripción:** Permisos disponibles en el sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `code` | `varchar(100)` | Código único |
| `name` | `varchar(100)` | Nombre |
| `description` | `text` | Descripción |

---

### 12. `app.role_permissions`

**Descripción:** Relación muchos-a-muchos entre roles y permisos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `role_id` | `integer` | FK a roles |
| `permission_id` | `integer` | FK a permissions |

---

## 💬 Tablas de Interacción Social

### 13. `app.comments`

**Descripción:** Sistema de comentarios polimórfico.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `commentable_type` | `varchar(20)` | NOT NULL | | Tipo de entidad |
| `commentable_id` | `bigint` | NOT NULL | | ID de la entidad |
| `user_id` | `bigint` | NULL | | Usuario que comentó |
| `parent_id` | `bigint` | NULL | | ID comentario padre (respuestas) |
| `content` | `text` | NOT NULL | | Contenido del comentario |
| `is_spoiler` | `boolean` | NULL | `false` | Marca de spoiler |
| `likes_count` | `integer` | NULL | `0` | Total de likes |
| `replies_count` | `integer` | NULL | `0` | Total de respuestas |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | Fecha creación |
| `updated_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | Última edición |
| `deleted_at` | `timestamptz` | NULL | | Soft delete |
| `images` | `jsonb` | NULL | `'[]'::jsonb` | URLs de imágenes (max 4) |

**Índices:**
- `idx_comments_polymorphic` - (commentable_type, commentable_id)
- `idx_comments_user` - (user_id)
- `idx_comments_likes` - Ordenamiento por popularidad
- `idx_comments_created_at` - Ordenamiento temporal
- `idx_comments_with_images` - Comentarios con imágenes

**Constraints:**
- `check_images_max_count` - Máximo 4 imágenes

**Foreign Keys:**
- `comments_user_id_fkey` → `users(id)` ON DELETE CASCADE
- `comments_parent_id_fkey` → `comments(id)` ON DELETE CASCADE (respuestas)

**Triggers:**
- `trg_insert_comment` - Acciones post-inserción
- `trg_comment_insert_update_replies` - Actualiza contador de respuestas
- `trg_comment_delete_update_replies` - Actualiza al borrar
- `trg_comments_update_time` - Actualiza timestamp

**Tipos válidos para `commentable_type`:**
- `anime`, `manga`, `novel`, `donghua`, `manhua`, `manhwa`, `fan_comic`
- `character`, `voice_actor`
- `review`

---

### 14. `app.comment_reactions`

**Descripción:** Reacciones a comentarios (likes, etc.).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `comment_id` | `bigint` | FK a comments |
| `user_id` | `bigint` | FK a users |
| `reaction_type` | `varchar(20)` | Tipo de reacción |
| `created_at` | `timestamptz` | Fecha |

---

### 15. `app.reviews`

**Descripción:** Reseñas polimórficas de medios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `user_id` | `bigint` | NOT NULL | | Autor de la review |
| `reviewable_type` | `varchar(20)` | NOT NULL | | Tipo de medio |
| `reviewable_id` | `bigint` | NOT NULL | | ID del medio |
| `content` | `text` | NOT NULL | | Contenido de la reseña |
| `overall_score` | `integer` | NULL | | Puntuación 1-10 |
| `helpful_votes` | `integer` | NULL | `0` | Votos útiles |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `deleted_at` | `timestamptz` | NULL | | Soft delete |

**Índices:**
- `idx_reviews_polymorphic` - (reviewable_type, reviewable_id)
- `idx_reviews_user_unique` - UNIQUE (user_id, reviewable_type, reviewable_id)
- `idx_reviews_helpful` - Ordenamiento por utilidad

**Constraints:**
- `reviews_overall_score_check` - Score entre 1 y 10

**Triggers:**
- `trg_insert_review` - Post-inserción
- `trg_review_insert_update_stats` - Actualiza stats del medio
- `trg_review_update_update_stats` - Al editar score
- `trg_review_delete_update_stats` - Al borrar

---

### 16. `app.review_votes`

**Descripción:** Votos de utilidad en reviews.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `review_id` | `bigint` | FK a reviews |
| `user_id` | `bigint` | FK a users |
| `vote_type` | `varchar(10)` | helpful/not_helpful |
| `created_at` | `timestamptz` | |

---

### 17. `app.lists`

**Descripción:** Listas personalizadas de usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `user_id` | `bigint` | NOT NULL | | Dueño de la lista |
| `name` | `varchar(150)` | NOT NULL | | Nombre de la lista |
| `slug` | `varchar(150)` | NOT NULL | | Slug único por usuario |
| `description` | `text` | NULL | | Descripción |
| `is_public` | `boolean` | NULL | `false` | Visibilidad |
| `is_default` | `boolean` | NULL | `false` | Lista por defecto |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | |

**Índices:**
- `lists_user_id_slug_key` - UNIQUE (user_id, slug)
- `idx_lists_userid`

**Listas por defecto típicas:**
- Watching / Leyendo
- Completed / Completado
- Plan to Watch / Plan de Ver
- Dropped / Abandonado
- On Hold / En Pausa

---

### 18. `app.list_items`

**Descripción:** Items en listas (polimórfico).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `list_id` | `bigint` | NOT NULL | | FK a lists |
| `listable_type` | `varchar(20)` | NOT NULL | | Tipo de medio |
| `listable_id` | `bigint` | NOT NULL | | ID del medio |
| `status` | `varchar(50)` | NULL | | Estado (watching, completed, etc.) |
| `progress` | `integer` | NULL | `0` | Progreso (episodios/capítulos) |
| `score` | `integer` | NULL | | Puntuación 1-10 |
| `notes` | `text` | NULL | | Notas personales |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |

**⚠️ IMPORTANTE:**
- **NO tiene columna `deleted_at`** (hard delete)

**Índices:**
- `list_items_list_id_listable_type_listable_id_key` - UNIQUE
- `idx_list_items_listid`
- `idx_list_items_status`
- `idx_user_lists_user_status`

**Constraints:**
- `list_items_score_check` - Score entre 1 y 10 o NULL

**Triggers:**
- `trg_insert_list_item` - Post-inserción
- `trg_list_items_insert_update_popularity` - Actualiza popularidad del medio
- `trg_list_items_delete_update_popularity` - Al eliminar

---

### 19. `app.user_favorites`

**Descripción:** Sistema de favoritos polimórfico.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `user_id` | `bigint` | NOT NULL | | Usuario |
| `favorable_type` | `varchar(20)` | NOT NULL | | Tipo de entidad |
| `favorable_id` | `bigint` | NOT NULL | | ID de la entidad |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `is_public` | `boolean` | NULL | `true` | Visible públicamente |

**Índices:**
- `user_favorites_user_id_favorable_type_favorable_id_key` - UNIQUE
- `idx_user_favorites_polymorphic`
- `idx_user_favorites_user`
- `idx_user_favorites_public`

**Tipos válidos:**
- Medios: `anime`, `manga`, `novel`, `donghua`, `manhua`, `manhwa`, `fan_comic`
- Personas: `character`, `voice_actor`, `staff`

---

### 20. `app.user_follows`

**Descripción:** Sistema de seguimiento entre usuarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `follower_id` | `bigint` | Usuario que sigue |
| `following_id` | `bigint` | Usuario seguido |
| `created_at` | `timestamptz` | Fecha |

---

### 21. `app.notifications`

**Descripción:** Sistema de notificaciones polimórfico.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `recipient_user_id` | `bigint` | NOT NULL | | Usuario receptor |
| `actor_user_id` | `bigint` | NULL | | Usuario que realizó la acción |
| `action_type` | `varchar(50)` | NOT NULL | | Tipo de acción |
| `notifiable_type` | `varchar(20)` | NOT NULL | | Tipo de entidad |
| `notifiable_id` | `bigint` | NOT NULL | | ID de la entidad |
| `read_at` | `timestamptz` | NULL | | Fecha de lectura |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |

**Índices:**
- `idx_notifications_recipient` - (recipient_user_id, read_at)
- `idx_notifications_unread` - WHERE read_at IS NULL
- `idx_notifications_notifiable`
- `idx_notifications_action_type`

**Tipos de acción (`action_type`):**
- `comment_reply` - Respuesta a comentario
- `review_reply` - Respuesta a review
- `contribution_approved` - Contribución aprobada
- `contribution_rejected` - Contribución rechazada
- `new_follower` - Nuevo seguidor
- `favorite_updated` - Actualización en favorito
- etc.

---

## 🎭 Tablas de Contenido y Metadata

### 22. `app.characters`

**Descripción:** Personajes de anime/manga.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `integer` | NOT NULL | `nextval()` | ID único |
| `name` | `varchar(100)` | NOT NULL | | Nombre principal |
| `name_romaji` | `varchar(255)` | NULL | | Nombre romanizado |
| `name_native` | `varchar(255)` | NULL | | Nombre nativo |
| `image_url` | `varchar(500)` | NULL | | Imagen del personaje |
| `description` | `text` | NULL | | Biografía |
| `favorites_count` | `integer` | NULL | `0` | Total de favoritos |
| `slug` | `varchar(255)` | NULL | | URL amigable |
| `gender` | `varchar(20)` | NULL | | Género |
| `age` | `varchar(20)` | NULL | | Edad |
| `blood_type` | `varchar(5)` | NULL | | Tipo de sangre |
| `date_of_birth` | `date` | NULL | | Fecha de nacimiento |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |

**Índices:**
- `characters_slug_key` - UNIQUE
- `idx_characters_favorites`

---

### 23. `app.characterable_characters`

**Descripción:** Relación polimórfica entre personajes y medios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `character_id` | `integer` | FK a characters |
| `characterable_type` | `varchar(20)` | Tipo de medio |
| `characterable_id` | `integer` | ID del medio |
| `role` | `varchar(20)` | Main, Supporting, Background |

---

### 24. `app.voice_actors`

**Descripción:** Actores de voz / seiyuu.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `integer` | NOT NULL | `nextval()` | ID único |
| `name_romaji` | `varchar(255)` | NULL | | Nombre romanizado |
| `name_native` | `varchar(255)` | NULL | | Nombre nativo |
| `image_url` | `varchar(500)` | NULL | | Foto |
| `language` | `varchar(10)` | NULL | `'ja'` | Idioma (ja, en, es, etc.) |
| `bio` | `text` | NULL | | Biografía |
| `favorites_count` | `integer` | NULL | `0` | Favoritos |
| `slug` | `varchar(255)` | NULL | | URL amigable |
| `gender` | `varchar(20)` | NULL | | Género |
| `date_of_birth` | `date` | NULL | | Fecha nacimiento |
| `blood_type` | `varchar(5)` | NULL | | Tipo de sangre |
| `hometown` | `varchar(255)` | NULL | | Ciudad natal |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |

**Índices:**
- `voice_actors_slug_key` - UNIQUE
- `idx_voice_actors_favorites`
- `idx_voice_actors_language`

---

### 25. `app.character_voice_actors`

**Descripción:** Relación entre personajes y actores de voz.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `character_id` | `integer` | FK a characters |
| `voice_actor_id` | `integer` | FK a voice_actors |
| `language` | `varchar(10)` | Idioma del doblaje |

---

### 26. `app.staff`

**Descripción:** Personal de producción (directores, escritores, etc.).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `name` | `varchar(255)` | Nombre |
| `image_url` | `varchar(500)` | Foto |
| `bio` | `text` | Biografía |

---

### 27. `app.staffable_staff`

**Descripción:** Relación polimórfica staff-medio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `staff_id` | `integer` | FK a staff |
| `staffable_type` | `varchar(20)` | Tipo de medio |
| `staffable_id` | `integer` | ID del medio |
| `role` | `varchar(50)` | Director, Writer, Producer, etc. |

---

### 28. `app.studios`

**Descripción:** Estudios de animación.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `name` | `varchar(255)` | Nombre del estudio |

**Índices:**
- `studios_name_key` - UNIQUE

---

### 29. `app.studiable_studios`

**Descripción:** Relación polimórfica studio-medio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `studio_id` | `integer` | FK a studios |
| `studiable_type` | `varchar(20)` | Tipo de medio |
| `studiable_id` | `integer` | ID del medio |

---

### 30. `app.genres`

**Descripción:** Géneros de medios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `integer` | NOT NULL | `nextval()` | ID único |
| `code` | `varchar(100)` | NOT NULL | | Código único |
| `name_es` | `varchar(100)` | NOT NULL | | Nombre en español |
| `name_en` | `varchar(100)` | NOT NULL | | Nombre en inglés |
| `name_ja` | `varchar(100)` | NULL | | Nombre en japonés |
| `description_es` | `text` | NULL | | Descripción español |
| `description_en` | `text` | NULL | | Descripción inglés |
| `is_active` | `boolean` | NULL | `true` | Activo |

**Índices:**
- `genres_code_key` - UNIQUE

**Ejemplos:** Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller

---

### 31. `app.media_genres`

**Descripción:** Relación muchos-a-muchos entre medios y géneros (polimórfico).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `genre_id` | `integer` | FK a genres |
| `genreable_type` | `varchar(20)` | Tipo de medio |
| `genreable_id` | `integer` | ID del medio |

---

### 32. `app.tags`

**Descripción:** Etiquetas/tags para categorización detallada.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `name` | `varchar(100)` | Nombre del tag |
| `description` | `text` | Descripción |

**Índices:**
- `tags_name_key` - UNIQUE

**Ejemplos:** Isekai, School Life, Magic, Demons, Time Travel, Harem, Mecha, etc.

---

### 33. `app.taggable_tags`

**Descripción:** Relación polimórfica tags-medio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tag_id` | `integer` | FK a tags |
| `taggable_type` | `varchar(20)` | Tipo de medio |
| `taggable_id` | `integer` | ID del medio |

---

### 34. `app.media_statuses`

**Descripción:** Estados de publicación de medios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer` | ID único |
| `name` | `varchar(50)` | Nombre del estado |

**Estados típicos:**
- Finished / Finalizado
- Ongoing / En emisión
- Upcoming / Próximamente
- Cancelled / Cancelado
- Hiatus / En pausa

---

### 35. `app.episodes`

**Descripción:** Episodios de anime/donghua.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `anime_id` | `bigint` | NOT NULL | | FK a anime |
| `episode_number` | `integer` | NOT NULL | | Número de episodio |
| `title` | `varchar(500)` | NULL | | Título del episodio |
| `title_romaji` | `varchar(500)` | NULL | | Título romanizado |
| `title_japanese` | `varchar(500)` | NULL | | Título en japonés |
| `synopsis` | `text` | NULL | | Sinopsis |
| `air_date` | `date` | NULL | | Fecha de emisión |
| `duration` | `integer` | NULL | | Duración (minutos) |
| `thumbnail_url` | `varchar(800)` | NULL | | Miniatura |
| `video_url` | `varchar(800)` | NULL | | URL del video |
| `is_filler` | `boolean` | NULL | `false` | Episodio relleno |
| `is_recap` | `boolean` | NULL | `false` | Episodio resumen |
| `created_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamptz` | NULL | `CURRENT_TIMESTAMP` | |

**Índices:**
- `episodes_anime_id_episode_number_key` - UNIQUE
- `idx_episodes_anime_id`
- `idx_episodes_air_date`

**Foreign Keys:**
- `episodes_anime_id_fkey` → `anime(id)` ON DELETE CASCADE

---

### 36. `app.external_links`

**Descripción:** Links externos a sitios oficiales (polimórfico).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `bigint` | NOT NULL | `nextval()` | ID único |
| `linkable_type` | `varchar(20)` | NOT NULL | | Tipo de entidad |
| `linkable_id` | `integer` | NOT NULL | | ID de la entidad |
| `site_name` | `varchar(100)` | NOT NULL | | Nombre del sitio |
| `url` | `text` | NOT NULL | | URL |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |

**Índices:**
- `idx_external_links_media`

**Sitios típicos:** Official Site, Twitter, Crunchyroll, Netflix, Amazon Prime, etc.

---

### 37. `app.media_relations`

**Descripción:** Relaciones entre medios (polimórfico bidireccional).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `integer` | NOT NULL | `nextval()` | ID único |
| `source_type` | `varchar(20)` | NOT NULL | | Tipo medio origen |
| `source_id` | `integer` | NOT NULL | | ID medio origen |
| `target_type` | `varchar(20)` | NOT NULL | | Tipo medio destino |
| `target_id` | `integer` | NOT NULL | | ID medio destino |
| `relation_type` | `varchar(30)` | NOT NULL | | Tipo de relación |

**Índices:**
- `idx_media_relations_source`
- `idx_media_relations_target`
- `idx_media_relations_type`

**Tipos de relación (`relation_type`):**
- `sequel` - Secuela
- `prequel` - Precuela
- `adaptation` - Adaptación
- `source` - Fuente original
- `side_story` - Historia paralela
- `spin_off` - Spin-off
- `alternative` - Versión alternativa
- `special` - Especial
- `ova` - OVA
- `ona` - ONA
- `movie` - Película
- `summary` - Resumen
- `full_story` - Historia completa
- `parent_story` - Historia principal
- `character` - Comparten personaje
- `other` - Otra relación

**Constraints:**
- `media_relations_relation_type_check`

---

### 38. `app.alternative_titles`

**Descripción:** Títulos alternativos en diferentes idiomas (polimórfico).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | `integer` | NOT NULL | `nextval()` | ID único |
| `titleable_type` | `varchar(20)` | NOT NULL | | Tipo de medio |
| `titleable_id` | `integer` | NOT NULL | | ID del medio |
| `language` | `varchar(10)` | NOT NULL | | Código de idioma |
| `text` | `varchar(255)` | NOT NULL | | Título alternativo |

**Índices:**
- `alternative_titles_titleable_type_titleable_id_language_tex_key` - UNIQUE
- `idx_titles_polymorphic`

**Idiomas comunes:** en, es, ja, zh, ko, pt, fr, de, it, ru

---

### 39. `app.media_trailers`

**Descripción:** Trailers de medios (polimórfico).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `trailerable_type` | `varchar(20)` | Tipo de medio |
| `trailerable_id` | `integer` | ID del medio |
| `url` | `varchar(500)` | URL del trailer |
| `site` | `varchar(50)` | YouTube, Dailymotion, etc. |

---

### 40. `app.trailer_views`

**Descripción:** Conteo de vistas de trailers.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `trailer_id` | `integer` | FK a media_trailers |
| `user_id` | `bigint` | FK a users (nullable) |
| `created_at` | `timestamptz` | Fecha vista |

---

## 🛠️ Tablas de Sistema

### 41. `app.content_contributions`

**Descripción:** Contribuciones de usuarios al contenido.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `contributor_user_id` | `bigint` | Usuario contribuyente |
| `assigned_to_user_id` | `bigint` | Moderador asignado |
| `reviewed_by_user_id` | `bigint` | Moderador que revisó |
| `contribution_type` | `varchar(50)` | Tipo de contribución |
| `status` | `varchar(20)` | pending, approved, rejected |

---

### 42. `app.content_reports`

**Descripción:** Reportes de contenido inapropiado.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `reported_by` | `bigint` | Usuario que reporta |
| `reviewed_by` | `bigint` | Moderador que revisa |
| `reportable_type` | `varchar(20)` | Tipo de contenido |
| `reportable_id` | `bigint` | ID del contenido |
| `reason` | `text` | Razón del reporte |
| `status` | `varchar(20)` | pending, resolved, dismissed |

---

### 43. `app.user_contributions`

**Descripción:** Historial de contribuciones por usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | `bigint` | FK a users |
| `contribution_type` | `varchar(50)` | Tipo |
| `points_awarded` | `integer` | Puntos ganados |
| `created_at` | `timestamptz` | Fecha |

---

### 44. `app.action_points`

**Descripción:** Registro de puntos por acciones.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | `bigint` | FK a users |
| `action_type` | `varchar(50)` | Tipo de acción |
| `points` | `integer` | Puntos ganados/perdidos |
| `created_at` | `timestamptz` | Fecha |

---

### 45. `app.audit_log`

**Descripción:** Log de auditoría de cambios importantes.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | `bigint` | Usuario que realizó cambio |
| `action` | `varchar(50)` | Acción realizada |
| `table_name` | `varchar(100)` | Tabla afectada |
| `record_id` | `bigint` | ID del registro |
| `old_values` | `jsonb` | Valores anteriores |
| `new_values` | `jsonb` | Valores nuevos |
| `created_at` | `timestamptz` | Timestamp |

---

### 46. `app.rankings_cache`

**Descripción:** Caché de rankings para optimización.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `media_type` | `varchar(20)` | Tipo de medio |
| `media_id` | `bigint` | ID del medio |
| `ranking_type` | `varchar(50)` | daily, weekly, monthly, all_time |
| `position` | `integer` | Posición en ranking |
| `score` | `numeric` | Score calculado |
| `updated_at` | `timestamptz` | Última actualización |

---

### 47. `app.fan_comic`

**⚠️ NOTA:** Parece ser una tabla duplicada o legacy de `fan_comics`. Verificar si está en uso.

---

## 📊 Vistas

### 48. `app.v_user_public_profile`

**Descripción:** Vista pública de perfiles de usuario.

**Campos:** username, display_name, avatar_url, bio, level, followers_count, etc. (excluye email, password_hash)

---

### 49. `app.v_user_contribution_stats`

**Descripción:** Estadísticas de contribuciones por usuario.

**Campos:** user_id, total_contributions, approved_count, pending_count, points_total

---

### 50. `app.v_moderator_report_stats`

**Descripción:** Estadísticas de reportes para moderadores.

**Campos:** pending_reports, resolved_reports, total_by_type

---

## 🔗 Patrones Polimórficos

El sistema usa extensivamente patrones polimórficos para relaciones flexibles:

### Patrón 1: `{entity}_type` + `{entity}_id`

**Tablas que lo usan:**

1. **comments**
   - `commentable_type` + `commentable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic, character, voice_actor, review

2. **reviews**
   - `reviewable_type` + `reviewable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

3. **list_items**
   - `listable_type` + `listable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic
   - ⚠️ **NO tiene `deleted_at`**

4. **user_favorites**
   - `favorable_type` + `favorable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic, character, voice_actor, staff

5. **notifications**
   - `notifiable_type` + `notifiable_id`
   - Tipos: comment, review, contribution, user_follow, etc.

6. **external_links**
   - `linkable_type` + `linkable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

7. **characterable_characters**
   - `characterable_type` + `characterable_id`
   - Tipos: anime, manga, novel, donghua, manhua, manhwa

8. **staffable_staff**
   - `staffable_type` + `staffable_id`
   - Tipos: anime, donghua

9. **studiable_studios**
   - `studiable_type` + `studiable_id`
   - Tipos: anime, donghua

10. **media_genres**
    - `genreable_type` + `genreable_id`
    - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

11. **taggable_tags**
    - `taggable_type` + `taggable_id`
    - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

12. **alternative_titles**
    - `titleable_type` + `titleable_id`
    - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

13. **media_trailers**
    - `trailerable_type` + `trailerable_id`
    - Tipos: anime, donghua

14. **media_relations**
    - `source_type` + `source_id`
    - `target_type` + `target_id`
    - Tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic

15. **content_reports**
    - `reportable_type` + `reportable_id`
    - Tipos: comment, review, user, media

---

## 🆔 IDs Externos (APIs)

Las tablas de medios principales tienen columnas para IDs de servicios externos:

### Servicios Soportados:

1. **MyAnimeList (MAL)**
   - Columna: `mal_id` (bigint, UNIQUE)
   - Tablas: anime, manga, novels, donghua, manhua, manhwa

2. **AniList**
   - Columna: `anilist_id` (bigint, UNIQUE)
   - Tablas: anime, manga, novels, donghua, manhua, manhwa

3. **Kitsu**
   - Columna: `kitsu_id` (bigint, UNIQUE)
   - Tablas: anime, manga, novels, donghua, manhua, manhwa

### ⚠️ IMPORTANTE:

- **`fan_comics` NO tiene IDs externos** (contenido generado por usuarios)
- Cada ID externo tiene índice UNIQUE para evitar duplicados
- `external_payload` (jsonb) almacena datos adicionales de APIs

---

## 📋 Resumen de Diferencias por Tipo de Medio

### Estructura de Columnas:

| Tabla | title_native | title_romaji | episode_count | volumes | chapters | IDs Externos |
|-------|:------------:|:------------:|:-------------:|:-------:|:--------:|:------------:|
| **anime** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **manga** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **novels** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **donghua** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **manhua** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **manhwa** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **fan_comics** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Columnas Únicas de `fan_comics`:

- Usa `title` (NO `title_romaji` ni `title_native`)
- Solo tiene `chapters` (NO `volumes`)
- NO tiene `mal_id`, `anilist_id`, `kitsu_id`
- NO tiene `external_payload`

### Soft Delete:

**Tablas CON `deleted_at`:**
- ✅ users, anime, manga, novels, donghua, manhua, manhwa, fan_comics
- ✅ comments, reviews

**Tablas SIN `deleted_at`:**
- ❌ list_items (hard delete)
- ❌ user_favorites (hard delete)
- ❌ Todas las tablas polimórficas de relación

---

## 🔧 Triggers y Funciones Importantes

### Triggers Comunes:

1. **`trg_{table}_update_time`**
   - Actualiza `updated_at` automáticamente
   - Tablas: users, anime, manga, comments, reviews, etc.

2. **`trg_{media}_update_popularity`**
   - Recalcula popularidad basada en `ratings_count` y `favourites`
   - Tablas: anime, manga, novels, donghua, manhua, manhwa, fan_comics

3. **`trg_{media}_update_ranking`**
   - Recalcula ranking basado en `average_score`, `ratings_count`, `popularity`
   - Tablas: anime, manga, novels, donghua, manhua, manhwa, fan_comics

4. **`trg_set_{media}_slug`**
   - Genera slug único basado en título
   - Tablas: anime, manga, novels, donghua, manhua, manhwa, fan_comics

5. **`trg_insert_comment`**
   - Acciones post-inserción de comentario
   - Incrementa contadores, crea notificaciones

6. **`trg_insert_review`**
   - Acciones post-inserción de review
   - Actualiza stats del medio

7. **`trg_list_items_*_update_popularity`**
   - Actualiza popularidad del medio al agregar/eliminar de listas

### Funciones:

- `fn_update_updated_at()` - Actualiza timestamp
- `fn_update_media_popularity()` - Calcula popularidad
- `fn_update_media_ranking()` - Calcula ranking
- `fn_update_media_review_stats()` - Actualiza stats de reviews
- `fn_update_comment_replies()` - Actualiza contador de respuestas
- `fn_update_list_item_popularity()` - Actualiza popularidad por listas
- `trg_users_recalc_level()` - Recalcula nivel de usuario

---

## 📌 Notas Finales

### Convenciones de Nombrado:

1. **Tablas:** Plural en minúsculas (`users`, `comments`, `anime`)
2. **IDs:** `id` para PK, `{tabla}_id` para FKs
3. **Timestamps:** `created_at`, `updated_at`, `deleted_at`
4. **Polimórficos:** `{entity}able_type` + `{entity}able_id`
5. **Contadores:** `{thing}_count` (ratings_count, followers_count)
6. **Flags:** `is_{condition}` (is_active, is_nsfw, is_approved)

### Consideraciones de Performance:

- Índices en columnas polimórficas `(type, id)`
- Índices en foreign keys
- Índices en columnas de ordenamiento (score, created_at)
- Full-text search con GIN en títulos
- Soft delete con índices `WHERE deleted_at IS NULL`

### Seguridad:

- Passwords con hash (bcrypt/argon2)
- Soft delete para auditoría
- Audit log para cambios críticos
- Permisos granulares con roles
- Validación de scores (1-10)
- Validación de imágenes (max 4 en comments)

---

**📅 Última Actualización:** 31 de Octubre, 2025  
**🔢 Total de Tablas:** 50  
**🔢 Total de Vistas:** 3  
**💾 DBMS:** PostgreSQL 17  
**🗂️ Schema:** `app`
