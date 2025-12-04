# 🗄️ Base de Datos - Documentación Completa

Documentación detallada del schema `app` en PostgreSQL.

**Total:** 57 tablas/vistas

---

## 📋 Índice Rápido

| # | Tabla | Tipo | Descripción |
|:-:|-------|:----:|-------------|
| 1 | [`action_points`](#action_points) | 📋 Tabla | Define cuántos puntos recibe un usuario por cada tipo de ... |
| 2 | [`alternative_titles`](#alternative_titles) | 📋 Tabla | Almacena títulos alternativos de cualquier media (anime, ... |
| 3 | [`anime`](#anime) | 📋 Tabla | Catálogo principal de anime. Contiene toda la información... |
| 4 | [`audit_log`](#audit_log) | 📋 Tabla | Registro de auditoría de acciones importantes del sistema... |
| 5 | [`character_voice_actors`](#character_voice_actors) | 📋 Tabla | Relación muchos-a-muchos entre personajes y actores de vo... |
| 6 | [`characterable_characters`](#characterable_characters) | 📋 Tabla | Relación polimórfica entre personajes y media. Permite as... |
| 7 | [`characters`](#characters) | 📋 Tabla | Catálogo de personajes. Incluye nombre, descripción, imag... |
| 8 | [`comment_reactions`](#comment_reactions) | 📋 Tabla | Reacciones (likes/dislikes) a comentarios. Un usuario pue... |
| 9 | [`comment_reports`](#comment_reports) | 📋 Tabla | Reportes de comentarios inapropiados. Los usuarios report... |
| 10 | [`comments`](#comments) | 📋 Tabla | Sistema de comentarios polimórfico. Soporta comentarios e... |
| 11 | [`content_contributions`](#content_contributions) | 📋 Tabla | Ediciones de contenido existente propuestas por usuarios.... |
| 12 | [`content_reports`](#content_reports) | 📋 Tabla | Reportes de contenido erróneo o inapropiado en fichas de ... |
| 13 | [`donghua`](#donghua) | 📋 Tabla | Catálogo de donghua (animación china). Estructura similar... |
| 14 | [`episodes`](#episodes) | 📋 Tabla | Episodios de anime/donghua. Información por episodio: núm... |
| 15 | [`external_links`](#external_links) | 📋 Tabla | Enlaces externos de media (sitios oficiales, streaming, e... |
| 16 | [`fan_comics`](#fan_comics) | 📋 Tabla | Catálogo de fan comics/doujinshi creados por fans. |
| 17 | [`genres`](#genres) | 📋 Tabla | Catálogo de géneros (Acción, Romance, Comedia, etc). Cada... |
| 18 | [`list_items`](#list_items) | 📋 Tabla | Items individuales dentro de listas de usuarios. Cada ite... |
| 19 | [`lists`](#lists) | 📋 Tabla | Listas personalizadas de usuarios (Watchlist, Favoritos, ... |
| 20 | [`login_attempts`](#login_attempts) | 📋 Tabla | Registro de intentos de login fallidos. Usado para rate l... |
| 21 | [`manga`](#manga) | 📋 Tabla | Catálogo principal de manga japonés. Estructura similar a... |
| 22 | [`manhua`](#manhua) | 📋 Tabla | Catálogo de manhua (comics chinos). Similar a manga. |
| 23 | [`manhwa`](#manhwa) | 📋 Tabla | Catálogo de manhwa (comics coreanos). Similar a manga. |
| 24 | [`media_genres`](#media_genres) | 📋 Tabla | Relación muchos-a-muchos entre media y géneros. Polimórfi... |
| 25 | [`media_relations`](#media_relations) | 📋 Tabla | Relaciones entre media: secuelas, precuelas, spin-offs, a... |
| 26 | [`media_statuses`](#media_statuses) | 📋 Tabla | Catálogo de estados de media: Emitiendo, Finalizado, Próx... |
| 27 | [`media_trailers`](#media_trailers) | 📋 Tabla | Trailers de media (YouTube, etc). Polimórfica. Guarda vie... |
| 28 | [`notifications`](#notifications) | 📋 Tabla | Notificaciones para usuarios. Tipos: contribución aprobad... |
| 29 | [`novels`](#novels) | 📋 Tabla | Catálogo de novelas ligeras (light novels). Estructura si... |
| 30 | [`oauth_accounts`](#oauth_accounts) | 📋 Tabla | Cuentas OAuth vinculadas (Google, Discord, etc). Un usuar... |
| 31 | [`password_reset_tokens`](#password_reset_tokens) | 📋 Tabla | Tokens temporales para resetear contraseña. Expiran despu... |
| 32 | [`permissions`](#permissions) | 📋 Tabla | Catálogo de permisos del sistema (can_edit, can_delete, c... |
| 33 | [`rankings_cache`](#rankings_cache) | 📋 Tabla | Cache de rankings calculados. Evita recalcular rankings e... |
| 34 | [`recovery_codes`](#recovery_codes) | 📋 Tabla | Códigos de recuperación para 2FA. Se usan cuando el usuar... |
| 35 | [`review_reports`](#review_reports) | 📋 Tabla | Reportes de reseñas inapropiadas. Similar a comment_reports. |
| 36 | [`review_votes`](#review_votes) | 📋 Tabla | Votos de utilidad en reseñas (útil/no útil). |
| 37 | [`reviews`](#reviews) | 📋 Tabla | Reseñas de media escritas por usuarios. Incluyen rating y... |
| 38 | [`role_permissions`](#role_permissions) | 📋 Tabla | Relación muchos-a-muchos entre roles y permisos. |
| 39 | [`roles`](#roles) | 📋 Tabla | Catálogo de roles: user, moderator, admin, super_admin. |
| 40 | [`staff`](#staff) | 📋 Tabla | Catálogo de staff de la industria: directores, escritores... |
| 41 | [`staffable_staff`](#staffable_staff) | 📋 Tabla | Relación polimórfica entre staff y media. Define el rol d... |
| 42 | [`studiable_studios`](#studiable_studios) | 📋 Tabla | Relación polimórfica entre estudios y media. |
| 43 | [`studios`](#studios) | 📋 Tabla | Catálogo de estudios de animación (MAPPA, Ufotable, etc). |
| 44 | [`taggable_tags`](#taggable_tags) | 📋 Tabla | Relación polimórfica entre tags y media. |
| 45 | [`tags`](#tags) | 📋 Tabla | Catálogo de tags/etiquetas descriptivas (Gore, Isekai, Ti... |
| 46 | [`trailer_views`](#trailer_views) | 📋 Tabla | Registro de vistas de trailers. Para analytics. |
| 47 | [`user_2fa`](#user_2fa) | 📋 Tabla | Configuración de autenticación de dos factores por usuario. |
| 48 | [`user_contributions`](#user_contributions) | 📋 Tabla | Propuestas de NUEVO contenido por usuarios (agregar anime... |
| 49 | [`user_favorites`](#user_favorites) | 📋 Tabla | Favoritos de usuarios. Polimórfica - puede ser cualquier ... |
| 50 | [`user_follows`](#user_follows) | 📋 Tabla | Sistema de seguimiento entre usuarios. |
| 51 | [`user_reports`](#user_reports) | 📋 Tabla | Reportes de usuarios problemáticos. |
| 52 | [`user_roles`](#user_roles) | 📋 Tabla | Relación usuarios-roles. Un usuario puede tener múltiples... |
| 53 | [`users`](#users) | 📋 Tabla | Tabla principal de usuarios. Contiene auth, perfil, confi... |
| 54 | [`v_moderator_report_stats`](#v_moderator_report_stats) | 👁️ Vista | (VISTA) Estadísticas de reportes para moderadores. |
| 55 | [`v_user_contribution_stats`](#v_user_contribution_stats) | 👁️ Vista | (VISTA) Estadísticas de contribuciones por usuario. |
| 56 | [`v_user_public_profile`](#v_user_public_profile) | 👁️ Vista | (VISTA) Perfil público de usuario (sin datos sensibles). |
| 57 | [`voice_actors`](#voice_actors) | 📋 Tabla | Catálogo de actores de voz/seiyuus. |

---

# 📊 Detalle de Tablas

## `action_points`

> Define cuántos puntos recibe un usuario por cada tipo de acción (contribuir, reportar, etc). Usado por el sistema de gamificación.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `action` | character varying(64) | ❌ | 🔑 PK | - |
| `points` | integer | ❌ |  | - |

---

## `alternative_titles`

> Almacena títulos alternativos de cualquier media (anime, manga, etc) en diferentes idiomas. Relación polimórfica via titleable_type/id.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.alternati... |
| `titleable_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `titleable_id` | integer | ❌ | 🔒 UQ | - |
| `language` | character varying(10) | ❌ | 🔒 UQ | - |
| `text` | character varying(255) | ❌ | 🔒 UQ | - |

---

## `anime`

> Catálogo principal de anime. Contiene toda la información: títulos, sinopsis, fechas, scores, imágenes, IDs externos (MAL, AniList, Kitsu).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.anime_id_... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `episode_count` | integer | ✅ |  | - |
| `duration` | integer | ✅ |  | - |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `trailer_url` | character varying(500) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `season` | character varying(20) | ✅ |  | - |
| `season_year` | integer | ✅ |  | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | - |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `country_of_origin` | character varying(10) | ✅ |  | - |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `preferences` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `is_published` | boolean | ✅ |  | true |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `ranking` | integer | ✅ |  | 0 |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `audit_log`

> Registro de auditoría de acciones importantes del sistema. Guarda quién hizo qué, cuándo y con qué datos.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.audit_log... |
| `user_id` | bigint | ✅ |  | - |
| `action` | character varying(100) | ❌ |  | - |
| `resource_type` | character varying(50) | ✅ |  | - |
| `resource_id` | bigint | ✅ |  | - |
| `old_values` | jsonb | ✅ |  | - |
| `new_values` | jsonb | ✅ |  | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |

---

## `character_voice_actors`

> Relación muchos-a-muchos entre personajes y actores de voz. Un personaje puede tener múltiples seiyuus.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `character_id` | integer | ❌ | 🔑 PK | - |
| `voice_actor_id` | integer | ❌ | 🔑 PK | - |
| `media_type` | character varying(20) | ❌ | 🔑 PK | - |
| `media_id` | integer | ❌ | 🔑 PK | - |

---

## `characterable_characters`

> Relación polimórfica entre personajes y media. Permite asociar personajes a anime, manga, etc.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `character_id` | integer | ❌ | 🔑 PK | - |
| `characterable_type` | character varying(20) | ❌ | 🔑 PK | - |
| `characterable_id` | integer | ❌ | 🔑 PK | - |
| `role` | character varying(50) | ✅ |  | 'supporting'::characte... |

---

## `characters`

> Catálogo de personajes. Incluye nombre, descripción, imagen, y datos de APIs externas.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.character... |
| `name` | character varying(100) | ❌ |  | - |
| `name_romaji` | character varying(255) | ✅ |  | - |
| `name_native` | character varying(255) | ✅ |  | - |
| `image_url` | character varying(500) | ✅ |  | - |
| `description` | text | ✅ |  | - |
| `favorites_count` | integer | ✅ |  | 0 |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `gender` | character varying(50) | ✅ |  | - |
| `age` | character varying(50) | ✅ |  | - |
| `blood_type` | character varying(10) | ✅ |  | - |
| `date_of_birth` | date | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `comment_reactions`

> Reacciones (likes/dislikes) a comentarios. Un usuario puede reaccionar una vez por comentario.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `comment_id` | bigint | ❌ | 🔑 PK | - |
| `user_id` | bigint | ❌ | 🔑 PK | - |
| `reaction_type` | character varying(10) | ✅ |  | - |

---

## `comment_reports`

> Reportes de comentarios inapropiados. Los usuarios reportan, moderadores revisan.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.comment_r... |
| `comment_id` | integer | ❌ | 🔗 FK | - |
| `reporter_user_id` | integer | ❌ | 🔗 FK | - |
| `reported_user_id` | integer | ❌ | 🔗 FK | - |
| `reason` | character varying(100) | ❌ |  | - |
| `comments` | text | ✅ |  | - |
| `status` | character varying(50) | ❌ |  | 'pending'::character v... |
| `assigned_to` | integer | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp without time zone | ✅ |  | - |
| `created_at` | timestamp without time zone | ✅ |  | now() |
| `resolved_at` | timestamp without time zone | ✅ |  | - |
| `resolved_by` | integer | ✅ | 🔗 FK | - |
| `resolution_notes` | text | ✅ |  | - |
| `action_taken` | character varying(50) | ✅ |  | - |

---

## `comments`

> Sistema de comentarios polimórfico. Soporta comentarios en cualquier tipo de media y respuestas anidadas.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.comments_... |
| `commentable_type` | character varying(20) | ❌ |  | - |
| `commentable_id` | bigint | ❌ |  | - |
| `user_id` | bigint | ✅ | 🔗 FK | - |
| `parent_id` | bigint | ✅ | 🔗 FK | - |
| `content` | text | ❌ |  | - |
| `is_spoiler` | boolean | ✅ |  | false |
| `likes_count` | integer | ✅ |  | 0 |
| `replies_count` | integer | ✅ |  | 0 |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `images` | jsonb | ✅ |  | '[]'::jsonb |

---

## `content_contributions`

> Ediciones de contenido existente propuestas por usuarios. Los moderadores aprueban/rechazan. Al aprobar, un trigger aplica los cambios.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.content_c... |
| `contributor_user_id` | integer | ❌ | 🔗 FK | - |
| `contributable_type` | character varying(50) | ❌ |  | - |
| `contributable_id` | integer | ❌ |  | - |
| `contribution_type` | character varying(50) | ❌ |  | 'add_info'::character ... |
| `status` | character varying(50) | ❌ |  | 'pending'::character v... |
| `proposed_changes` | jsonb | ❌ |  | - |
| `contribution_notes` | text | ✅ |  | - |
| `sources` | jsonb | ✅ |  | - |
| `assigned_to_user_id` | integer | ✅ | 🔗 FK | - |
| `moderator_notes` | text | ✅ |  | - |
| `reviewed_by_user_id` | integer | ✅ | 🔗 FK | - |
| `reviewed_at` | timestamp with time zone | ✅ |  | - |
| `created_at` | timestamp with time zone | ❌ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ❌ |  | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp with time zone | ✅ |  | - |

---

## `content_reports`

> Reportes de contenido erróneo o inapropiado en fichas de media.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.content_r... |
| `reportable_type` | character varying(20) | ❌ |  | - |
| `reportable_id` | bigint | ❌ |  | - |
| `reported_by` | bigint | ❌ | 🔗 FK | - |
| `report_reason` | text | ❌ |  | - |
| `status` | character varying(20) | ✅ |  | 'pending'::character v... |
| `reviewed_by` | bigint | ✅ | 🔗 FK | - |
| `moderator_notes` | text | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `resolved_at` | timestamp with time zone | ✅ |  | - |
| `assigned_to` | bigint | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp with time zone | ✅ |  | - |

---

## `donghua`

> Catálogo de donghua (animación china). Estructura similar a anime.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.donghua_i... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `episode_count` | integer | ✅ |  | - |
| `duration` | integer | ✅ |  | - |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `trailer_url` | character varying(500) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `season` | character varying(20) | ✅ |  | - |
| `season_year` | integer | ✅ |  | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | - |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `ranking` | integer | ✅ |  | 0 |
| `country_of_origin` | character varying(10) | ✅ |  | 'CN'::character varying |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `preferences` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `is_published` | boolean | ✅ |  | true |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `episodes`

> Episodios de anime/donghua. Información por episodio: número, título, fecha de emisión, thumbnail.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.episodes_... |
| `anime_id` | bigint | ❌ | 🔗 FK | - |
| `episode_number` | integer | ❌ | 🔒 UQ | - |
| `title` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ✅ |  | - |
| `title_japanese` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `air_date` | date | ✅ |  | - |
| `duration` | integer | ✅ |  | - |
| `thumbnail_url` | character varying(800) | ✅ |  | - |
| `video_url` | character varying(800) | ✅ |  | - |
| `is_filler` | boolean | ✅ |  | false |
| `is_recap` | boolean | ✅ |  | false |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `external_links`

> Enlaces externos de media (sitios oficiales, streaming, etc). Relación polimórfica.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.external_... |
| `linkable_type` | character varying(20) | ❌ |  | - |
| `linkable_id` | integer | ❌ |  | - |
| `site_name` | character varying(100) | ❌ |  | - |
| `url` | text | ❌ |  | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |

---

## `fan_comics`

> Catálogo de fan comics/doujinshi creados por fans.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.fan_comic... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `title` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `chapters` | integer | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | 'Fan Comic'::character... |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `ranking` | integer | ✅ |  | 0 |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `country_of_origin` | character varying(10) | ✅ |  | - |
| `is_nsfw` | boolean | ✅ |  | false |
| `is_approved` | boolean | ✅ |  | false |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `dominant_color` | character varying(7) | ✅ |  | - |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `volumes` | integer | ✅ |  | - |
| `title_romaji` | character varying(500) | ✅ |  | - |
| `title_native` | character varying(500) | ✅ |  | - |

---

## `genres`

> Catálogo de géneros (Acción, Romance, Comedia, etc). Cada género tiene nombre, slug e icono.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.genres_id... |
| `code` | character varying(100) | ❌ | 🔒 UQ | - |
| `name_es` | character varying(100) | ❌ |  | - |
| `name_en` | character varying(100) | ❌ |  | - |
| `name_ja` | character varying(100) | ✅ |  | - |
| `description_es` | text | ✅ |  | - |
| `description_en` | text | ✅ |  | - |
| `is_active` | boolean | ✅ |  | true |

---

## `list_items`

> Items individuales dentro de listas de usuarios. Cada item es una referencia a un media.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.list_item... |
| `list_id` | bigint | ❌ | 🔗 FK | - |
| `listable_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `listable_id` | bigint | ❌ | 🔒 UQ | - |
| `status` | character varying(50) | ✅ |  | - |
| `progress` | integer | ✅ |  | 0 |
| `score` | integer | ✅ |  | - |
| `notes` | text | ✅ |  | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |

---

## `lists`

> Listas personalizadas de usuarios (Watchlist, Favoritos, etc). Pueden ser públicas o privadas.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.lists_id_... |
| `user_id` | bigint | ❌ | 🔗 FK | - |
| `name` | character varying(150) | ❌ |  | - |
| `slug` | character varying(150) | ❌ | 🔒 UQ | - |
| `description` | text | ✅ |  | - |
| `is_public` | boolean | ✅ |  | false |
| `is_default` | boolean | ✅ |  | false |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |

---

## `login_attempts`

> Registro de intentos de login fallidos. Usado para rate limiting y seguridad.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.login_att... |
| `email` | character varying(255) | ❌ |  | - |
| `ip_address` | character varying(45) | ❌ |  | - |
| `success` | boolean | ❌ |  | - |
| `attempted_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `manga`

> Catálogo principal de manga japonés. Estructura similar a anime pero con campos específicos (chapters, volumes).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.manga_id_... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `volumes` | integer | ✅ |  | - |
| `chapters` | integer | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | - |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `country_of_origin` | character varying(10) | ✅ |  | - |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `ranking` | integer | ✅ |  | 0 |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `manhua`

> Catálogo de manhua (comics chinos). Similar a manga.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.manhua_id... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `volumes` | integer | ✅ |  | - |
| `chapters` | integer | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | 'Manhua'::character va... |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `ranking` | integer | ✅ |  | 0 |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `country_of_origin` | character varying(10) | ✅ |  | 'CN'::character varying |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `preferences` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `manhwa`

> Catálogo de manhwa (comics coreanos). Similar a manga.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.manhwa_id... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `volumes` | integer | ✅ |  | - |
| `chapters` | integer | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | 'Manhwa'::character va... |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `ranking` | integer | ✅ |  | 0 |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `country_of_origin` | character varying(10) | ✅ |  | 'KR'::character varying |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `preferences` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `media_genres`

> Relación muchos-a-muchos entre media y géneros. Polimórfica via media_type/media_id.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.media_gen... |
| `titleable_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `titleable_id` | integer | ❌ | 🔒 UQ | - |
| `genre_id` | integer | ❌ | 🔗 FK | - |

---

## `media_relations`

> Relaciones entre media: secuelas, precuelas, spin-offs, adaptaciones. Polimórfica.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.media_rel... |
| `source_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `source_id` | integer | ❌ | 🔒 UQ | - |
| `target_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `target_id` | integer | ❌ | 🔒 UQ | - |
| `relation_type` | character varying(30) | ❌ |  | - |

---

## `media_statuses`

> Catálogo de estados de media: Emitiendo, Finalizado, Próximamente, Cancelado, etc.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.media_sta... |
| `code` | character varying(50) | ❌ | 🔒 UQ | - |
| `label_es` | character varying(100) | ❌ |  | - |
| `label_en` | character varying(100) | ❌ |  | - |
| `description` | text | ✅ |  | - |

---

## `media_trailers`

> Trailers de media (YouTube, etc). Polimórfica. Guarda views y metadata.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.media_tra... |
| `mediable_type` | character varying(20) | ❌ |  | - |
| `mediable_id` | bigint | ❌ |  | - |
| `title` | character varying(255) | ❌ |  | - |
| `url` | text | ❌ |  | - |
| `thumbnail_url` | character varying(500) | ✅ |  | - |
| `views_count` | integer | ✅ |  | 0 |
| `duration_seconds` | integer | ✅ |  | - |
| `published_at` | timestamp with time zone | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `notifications`

> Notificaciones para usuarios. Tipos: contribución aprobada/rechazada, nuevo reporte, etc.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.notificat... |
| `recipient_user_id` | bigint | ❌ | 🔗 FK | - |
| `actor_user_id` | bigint | ✅ | 🔗 FK | - |
| `action_type` | character varying(50) | ❌ |  | - |
| `notifiable_type` | character varying(20) | ❌ |  | - |
| `notifiable_id` | bigint | ❌ |  | - |
| `read_at` | timestamp with time zone | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `novels`

> Catálogo de novelas ligeras (light novels). Estructura similar a manga.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.novels_id... |
| `created_by` | integer | ✅ | 🔗 FK | - |
| `updated_by` | integer | ✅ | 🔗 FK | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `mal_id` | bigint | ✅ | 🔒 UQ | - |
| `anilist_id` | bigint | ✅ | 🔒 UQ | - |
| `kitsu_id` | bigint | ✅ | 🔒 UQ | - |
| `title_native` | character varying(500) | ✅ |  | - |
| `title_romaji` | character varying(500) | ❌ |  | - |
| `title_english` | character varying(500) | ✅ |  | - |
| `title_spanish` | character varying(500) | ✅ |  | - |
| `synopsis` | text | ✅ |  | - |
| `volumes` | integer | ✅ |  | - |
| `chapters` | integer | ✅ |  | - |
| `cover_image_url` | character varying(800) | ✅ |  | - |
| `banner_image_url` | character varying(800) | ✅ |  | - |
| `status_id` | integer | ✅ | 🔗 FK | - |
| `source` | character varying(100) | ✅ |  | - |
| `type` | character varying(20) | ✅ |  | - |
| `average_score` | numeric | ✅ |  | 0 |
| `mean_score` | numeric | ✅ |  | - |
| `popularity` | integer | ✅ |  | 0 |
| `favourites` | integer | ✅ |  | 0 |
| `ratings_count` | integer | ✅ |  | 0 |
| `start_date` | date | ✅ |  | - |
| `end_date` | date | ✅ |  | - |
| `country_of_origin` | character varying(10) | ✅ |  | - |
| `is_nsfw` | boolean | ✅ |  | false |
| `external_payload` | jsonb | ✅ |  | - |
| `is_approved` | boolean | ✅ |  | false |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `ranking` | integer | ✅ |  | 0 |
| `dominant_color` | character varying(7) | ✅ |  | - |

---

## `oauth_accounts`

> Cuentas OAuth vinculadas (Google, Discord, etc). Un usuario puede tener múltiples providers.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.oauth_acc... |
| `user_id` | integer | ✅ | 🔗 FK | - |
| `provider` | character varying(50) | ❌ | 🔒 UQ | - |
| `provider_account_id` | character varying(255) | ❌ | 🔒 UQ | - |
| `access_token` | text | ✅ |  | - |
| `refresh_token` | text | ✅ |  | - |
| `expires_at` | timestamp without time zone | ✅ |  | - |
| `token_type` | character varying(50) | ✅ |  | - |
| `scope` | text | ✅ |  | - |
| `id_token` | text | ✅ |  | - |
| `created_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `password_reset_tokens`

> Tokens temporales para resetear contraseña. Expiran después de X tiempo.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.password_... |
| `user_id` | integer | ✅ | 🔗 FK | - |
| `token` | character varying(255) | ❌ | 🔒 UQ | - |
| `expires_at` | timestamp without time zone | ❌ |  | - |
| `used` | boolean | ✅ |  | false |
| `created_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |
| `recovery_method` | character varying(20) | ✅ |  | 'email'::character var... |

---

## `permissions`

> Catálogo de permisos del sistema (can_edit, can_delete, can_moderate, etc).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.permissio... |
| `name` | character varying(100) | ❌ | 🔒 UQ | - |
| `display_name` | character varying(150) | ❌ |  | - |
| `description` | text | ✅ |  | - |
| `resource` | character varying(50) | ✅ |  | - |
| `action` | character varying(50) | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `rankings_cache`

> Cache de rankings calculados. Evita recalcular rankings en cada request.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.rankings_... |
| `ranking_type` | character varying(50) | ❌ | 🔒 UQ | - |
| `media_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `media_id` | bigint | ❌ |  | - |
| `rank_position` | integer | ❌ | 🔒 UQ | - |
| `score` | numeric | ✅ |  | - |
| `calculated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `expires_at` | timestamp with time zone | ❌ |  | - |

---

## `recovery_codes`

> Códigos de recuperación para 2FA. Se usan cuando el usuario pierde acceso al authenticator.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.recovery_... |
| `user_id` | integer | ✅ | 🔗 FK | - |
| `code` | character varying(64) | ❌ | 🔒 UQ | - |
| `created_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |
| `last_regenerated` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `review_reports`

> Reportes de reseñas inapropiadas. Similar a comment_reports.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.review_re... |
| `review_id` | integer | ❌ | 🔗 FK | - |
| `reporter_user_id` | integer | ❌ | 🔗 FK | - |
| `reported_user_id` | integer | ❌ | 🔗 FK | - |
| `reason` | character varying(100) | ❌ |  | - |
| `comments` | text | ✅ |  | - |
| `status` | character varying(50) | ❌ |  | 'pending'::character v... |
| `created_at` | timestamp without time zone | ✅ |  | now() |
| `resolved_at` | timestamp without time zone | ✅ |  | - |
| `resolved_by` | integer | ✅ | 🔗 FK | - |
| `resolution_notes` | text | ✅ |  | - |
| `action_taken` | character varying(50) | ✅ |  | - |
| `assigned_to` | integer | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp without time zone | ✅ |  | - |

---

## `review_votes`

> Votos de utilidad en reseñas (útil/no útil).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `review_id` | bigint | ❌ | 🔑 PK | - |
| `user_id` | bigint | ❌ | 🔑 PK | - |
| `vote_type` | character varying(10) | ✅ |  | - |

---

## `reviews`

> Reseñas de media escritas por usuarios. Incluyen rating y texto.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.reviews_i... |
| `user_id` | bigint | ❌ | 🔗 FK | - |
| `reviewable_type` | character varying(20) | ❌ |  | - |
| `reviewable_id` | bigint | ❌ |  | - |
| `content` | text | ❌ |  | - |
| `overall_score` | integer | ✅ |  | - |
| `helpful_votes` | integer | ✅ |  | 0 |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp with time zone | ✅ |  | - |

---

## `role_permissions`

> Relación muchos-a-muchos entre roles y permisos.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `role_id` | integer | ❌ | 🔑 PK | - |
| `permission_id` | integer | ❌ | 🔑 PK | - |

---

## `roles`

> Catálogo de roles: user, moderator, admin, super_admin.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.roles_id_... |
| `name` | character varying(50) | ❌ | 🔒 UQ | - |
| `display_name` | character varying(100) | ❌ |  | - |
| `description` | text | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `staff`

> Catálogo de staff de la industria: directores, escritores, productores, etc.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.staff_id_... |
| `name_romaji` | character varying(255) | ✅ |  | - |
| `name_native` | character varying(255) | ✅ |  | - |
| `image_url` | character varying(500) | ✅ |  | - |
| `name` | character varying(255) | ✅ |  | - |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `bio` | text | ✅ |  | - |
| `primary_occupations` | ARRAY | ✅ |  | - |
| `gender` | character varying(50) | ✅ |  | - |
| `date_of_birth` | date | ✅ |  | - |
| `hometown` | character varying(255) | ✅ |  | - |
| `favorites_count` | integer | ✅ |  | 0 |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `anilist_id` | integer | ✅ |  | - |
| `blood_type` | character varying(10) | ✅ |  | - |

---

## `staffable_staff`

> Relación polimórfica entre staff y media. Define el rol del staff en cada obra.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `staff_id` | integer | ❌ | 🔑 PK | - |
| `staffable_type` | character varying(20) | ❌ | 🔑 PK | - |
| `staffable_id` | integer | ❌ | 🔑 PK | - |
| `role` | character varying(255) | ❌ | 🔑 PK | - |

---

## `studiable_studios`

> Relación polimórfica entre estudios y media.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `studio_id` | integer | ❌ | 🔑 PK | - |
| `studiable_type` | character varying(20) | ❌ | 🔑 PK | - |
| `studiable_id` | integer | ❌ | 🔑 PK | - |
| `is_main_studio` | boolean | ✅ |  | true |

---

## `studios`

> Catálogo de estudios de animación (MAPPA, Ufotable, etc).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.studios_i... |
| `name` | character varying(255) | ❌ | 🔒 UQ | - |

---

## `taggable_tags`

> Relación polimórfica entre tags y media.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `tag_id` | integer | ❌ | 🔑 PK | - |
| `taggable_type` | character varying(20) | ❌ | 🔑 PK | - |
| `taggable_id` | integer | ❌ | 🔑 PK | - |
| `is_spoiler` | boolean | ✅ |  | false |

---

## `tags`

> Catálogo de tags/etiquetas descriptivas (Gore, Isekai, Time Travel, etc).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.tags_id_s... |
| `name` | character varying(100) | ❌ | 🔒 UQ | - |
| `description` | text | ✅ |  | - |

---

## `trailer_views`

> Registro de vistas de trailers. Para analytics.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.trailer_v... |
| `trailer_id` | bigint | ✅ | 🔗 FK | - |
| `user_id` | bigint | ✅ | 🔗 FK | - |
| `ip_address` | character varying(45) | ✅ |  | - |
| `user_agent` | text | ✅ |  | - |
| `viewed_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `session_id` | character varying(255) | ✅ |  | - |

---

## `user_2fa`

> Configuración de autenticación de dos factores por usuario.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.user_2fa_... |
| `user_id` | integer | ✅ | 🔗 FK | - |
| `secret` | character varying(255) | ❌ |  | - |
| `enabled` | boolean | ✅ |  | true |
| `backup_codes` | ARRAY | ✅ |  | - |
| `created_at` | timestamp without time zone | ✅ |  | CURRENT_TIMESTAMP |
| `enabled_at` | timestamp without time zone | ✅ |  | - |
| `recovery_code` | character varying(64) | ✅ | 🔒 UQ | - |

---

## `user_contributions`

> Propuestas de NUEVO contenido por usuarios (agregar anime/manga que no existe).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.user_cont... |
| `user_id` | bigint | ❌ | 🔗 FK | - |
| `contributable_type` | character varying(20) | ❌ |  | - |
| `contributable_id` | bigint | ✅ |  | - |
| `contribution_data` | jsonb | ❌ |  | - |
| `status` | character varying(20) | ✅ |  | 'pending'::character v... |
| `is_visible_in_profile` | boolean | ✅ |  | true |
| `awarded_points` | integer | ✅ |  | 0 |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `reviewed_by` | bigint | ✅ |  | - |
| `reviewed_at` | timestamp with time zone | ✅ |  | - |
| `rejection_reason` | text | ✅ |  | - |
| `assigned_to` | bigint | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp with time zone | ✅ |  | - |

---

## `user_favorites`

> Favoritos de usuarios. Polimórfica - puede ser cualquier tipo de media.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.user_favo... |
| `user_id` | bigint | ❌ | 🔗 FK | - |
| `favorable_type` | character varying(20) | ❌ | 🔒 UQ | - |
| `favorable_id` | bigint | ❌ | 🔒 UQ | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `is_public` | boolean | ✅ |  | true |

---

## `user_follows`

> Sistema de seguimiento entre usuarios.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `follower_id` | bigint | ❌ | 🔑 PK | - |
| `following_id` | bigint | ❌ | 🔑 PK | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `user_reports`

> Reportes de usuarios problemáticos.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.user_repo... |
| `reported_user_id` | integer | ❌ | 🔗 FK | - |
| `reporter_user_id` | integer | ❌ | 🔗 FK | - |
| `reason` | character varying(100) | ❌ | 🔒 UQ | - |
| `description` | text | ❌ |  | - |
| `status` | character varying(50) | ❌ |  | 'pending'::character v... |
| `assigned_to` | integer | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp without time zone | ✅ |  | - |
| `created_at` | timestamp without time zone | ✅ |  | now() |
| `resolved_at` | timestamp without time zone | ✅ |  | - |
| `resolved_by` | integer | ✅ | 🔗 FK | - |
| `resolution_notes` | text | ✅ |  | - |
| `action_taken` | character varying(50) | ✅ |  | - |

---

## `user_roles`

> Relación usuarios-roles. Un usuario puede tener múltiples roles.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `user_id` | integer | ✅ | 🔗 FK | - |
| `role_id` | integer | ✅ | 🔗 FK | - |
| `assigned_by` | integer | ✅ | 🔗 FK | - |
| `assigned_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## `users`

> Tabla principal de usuarios. Contiene auth, perfil, configuración y estadísticas.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ❌ | 🔑 PK | nextval('app.users_id_... |
| `uuid` | uuid | ❌ |  | uuid_generate_v4() |
| `email` | character varying(320) | ❌ | 🔒 UQ | - |
| `password_hash` | character varying(255) | ❌ |  | - |
| `username` | character varying(80) | ❌ | 🔒 UQ | - |
| `display_name` | character varying(120) | ✅ |  | - |
| `created_at` | timestamp with time zone | ❌ |  | now() |
| `updated_at` | timestamp with time zone | ❌ |  | now() |
| `date_of_birth` | date | ✅ |  | - |
| `nationality_code` | character(2) | ✅ |  | - |
| `nationality_name` | character varying(100) | ✅ |  | - |
| `nationality_flag_url` | character varying(500) | ✅ |  | - |
| `bio` | character varying(200) | ✅ |  | - |
| `avatar_url` | character varying(500) | ✅ |  | - |
| `banner_url` | character varying(500) | ✅ |  | - |
| `points` | bigint | ❌ |  | 0 |
| `reputation_score` | bigint | ❌ |  | 0 |
| `level` | integer | ❌ |  | 1 |
| `contributions_count` | integer | ❌ |  | 0 |
| `saves_count` | integer | ❌ |  | 0 |
| `followers_count` | integer | ❌ |  | 0 |
| `following_count` | integer | ❌ |  | 0 |
| `is_active` | boolean | ✅ |  | true |
| `locale` | character varying(10) | ✅ |  | 'es-CL'::character var... |
| `deleted_at` | timestamp with time zone | ✅ |  | - |
| `email_verification_token` | character varying(255) | ✅ |  | - |
| `email_verification_expires` | timestamp without time zone | ✅ |  | - |
| `has_2fa_setup` | boolean | ✅ |  | false |
| `tracking_id` | character varying(12) | ❌ | 🔒 UQ | - |

---

## `v_moderator_report_stats`

> (VISTA) Estadísticas de reportes para moderadores.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `moderator_id` | bigint | ✅ |  | - |
| `moderator_username` | character varying(80) | ✅ |  | - |
| `pending_reports` | bigint | ✅ |  | - |
| `in_review_reports` | bigint | ✅ |  | - |
| `resolved_reports` | bigint | ✅ |  | - |
| `dismissed_reports` | bigint | ✅ |  | - |
| `total_reports_handled` | bigint | ✅ |  | - |

---

## `v_user_contribution_stats`

> (VISTA) Estadísticas de contribuciones por usuario.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `user_id` | bigint | ✅ |  | - |
| `username` | character varying(80) | ✅ |  | - |
| `pending_count` | bigint | ✅ |  | - |
| `approved_count` | bigint | ✅ |  | - |
| `rejected_count` | bigint | ✅ |  | - |
| `total_count` | bigint | ✅ |  | - |
| `total_points_earned` | bigint | ✅ |  | - |
| `last_contribution_at` | timestamp with time zone | ✅ |  | - |

---

## `v_user_public_profile`

> (VISTA) Perfil público de usuario (sin datos sensibles).

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | bigint | ✅ |  | - |
| `username` | character varying(80) | ✅ |  | - |
| `display_name` | character varying(120) | ✅ |  | - |
| `avatar_url` | character varying(500) | ✅ |  | - |
| `banner_url` | character varying(500) | ✅ |  | - |
| `bio` | character varying(200) | ✅ |  | - |
| `nationality_code` | character(2) | ✅ |  | - |
| `nationality_name` | character varying(100) | ✅ |  | - |
| `nationality_flag_url` | character varying(500) | ✅ |  | - |
| `level` | integer | ✅ |  | - |
| `points` | bigint | ✅ |  | - |
| `reputation_score` | bigint | ✅ |  | - |
| `contributions_count` | integer | ✅ |  | - |
| `saves_count` | integer | ✅ |  | - |
| `followers_count` | integer | ✅ |  | - |
| `following_count` | integer | ✅ |  | - |
| `created_at` | timestamp with time zone | ✅ |  | - |

---

## `voice_actors`

> Catálogo de actores de voz/seiyuus.

| Columna | Tipo | Null | Key | Default |
|---------|------|:----:|:---:|----------|
| `id` | integer | ❌ | 🔑 PK | nextval('app.voice_act... |
| `name_romaji` | character varying(255) | ✅ |  | - |
| `name_native` | character varying(255) | ✅ |  | - |
| `image_url` | character varying(500) | ✅ |  | - |
| `language` | character varying(10) | ✅ |  | 'ja'::character varying |
| `bio` | text | ✅ |  | - |
| `favorites_count` | integer | ✅ |  | 0 |
| `slug` | character varying(255) | ✅ | 🔒 UQ | - |
| `created_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |
| `gender` | character varying(50) | ✅ |  | - |
| `date_of_birth` | date | ✅ |  | - |
| `blood_type` | character varying(10) | ✅ |  | - |
| `hometown` | character varying(255) | ✅ |  | - |
| `updated_at` | timestamp with time zone | ✅ |  | CURRENT_TIMESTAMP |

---

## 📖 Leyenda

| Símbolo | Significado |
|:-------:|-------------|
| 🔑 PK | Primary Key - Identificador único |
| 🔗 FK | Foreign Key - Referencia a otra tabla |
| 🔒 UQ | Unique - Valor único en la tabla |
| ✅ | Permite NULL |
| ❌ | NOT NULL - Requerido |
| 👁️ | Vista (VIEW) |
| 📋 | Tabla |

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** 26 de noviembre de 2025
