# 📇 Base de Datos - Índices

Documentación de índices para optimización de consultas.

---

## 📊 Estadísticas Generales

| Métrica | Cantidad |
|---------|:--------:|
| **Total índices** | 247 |
| Primary Keys (🔑) | 53 |
| Unique (🔒) | 59 |
| GIN - Full Text (🔍) | 9 |
| B-Tree (🌳) | 128 |

---

## 📋 Resumen por Tabla

| Tabla | Total | PK | Unique | GIN | B-Tree |
|-------|:-----:|:--:|:------:|:---:|:------:|
| `action_points` | 1 | 1 | 0 | 0 | 0 |
| `alternative_titles` | 3 | 1 | 1 | 0 | 1 |
| `anime` | 12 | 1 | 4 | 1 | 6 |
| `audit_log` | 1 | 1 | 0 | 0 | 0 |
| `character_voice_actors` | 1 | 1 | 0 | 0 | 0 |
| `characterable_characters` | 1 | 1 | 0 | 0 | 0 |
| `characters` | 3 | 1 | 1 | 0 | 1 |
| `comment_reactions` | 1 | 1 | 0 | 0 | 0 |
| `comment_reports` | 8 | 1 | 1 | 0 | 6 |
| `comments` | 6 | 1 | 0 | 0 | 5 |
| `content_contributions` | 6 | 1 | 0 | 0 | 5 |
| `content_reports` | 6 | 1 | 0 | 0 | 5 |
| `donghua` | 12 | 1 | 4 | 1 | 6 |
| `episodes` | 4 | 1 | 1 | 0 | 2 |
| `external_links` | 2 | 1 | 0 | 0 | 1 |
| `fan_comics` | 13 | 1 | 4 | 1 | 7 |
| `genres` | 2 | 1 | 1 | 0 | 0 |
| `list_items` | 6 | 1 | 1 | 0 | 4 |
| `lists` | 3 | 1 | 1 | 0 | 1 |
| `login_attempts` | 2 | 1 | 0 | 2 | -1 |
| `manga` | 12 | 1 | 4 | 1 | 6 |
| `manhua` | 12 | 1 | 4 | 1 | 6 |
| `manhwa` | 12 | 1 | 4 | 1 | 6 |
| `media_genres` | 2 | 1 | 1 | 0 | 0 |
| `media_relations` | 5 | 1 | 1 | 0 | 3 |
| `media_statuses` | 2 | 1 | 1 | 0 | 0 |
| `media_trailers` | 3 | 1 | 0 | 0 | 2 |
| `notifications` | 5 | 1 | 0 | 0 | 4 |
| `novels` | 12 | 1 | 4 | 1 | 6 |
| `oauth_accounts` | 4 | 1 | 1 | 0 | 2 |
| `password_reset_tokens` | 5 | 1 | 1 | 0 | 3 |
| `permissions` | 2 | 1 | 1 | 0 | 0 |
| `rankings_cache` | 3 | 1 | 1 | 0 | 1 |
| `recovery_codes` | 5 | 1 | 2 | 0 | 2 |
| `review_reports` | 8 | 1 | 1 | 0 | 6 |
| `review_votes` | 1 | 1 | 0 | 0 | 0 |
| `reviews` | 6 | 1 | 1 | 0 | 4 |
| `role_permissions` | 1 | 1 | 0 | 0 | 0 |
| `roles` | 2 | 1 | 1 | 0 | 0 |
| `staff` | 4 | 1 | 1 | 0 | 2 |
| `staffable_staff` | 1 | 1 | 0 | 0 | 0 |
| `studiable_studios` | 1 | 1 | 0 | 0 | 0 |
| `studios` | 2 | 1 | 1 | 0 | 0 |
| `taggable_tags` | 1 | 1 | 0 | 0 | 0 |
| `tags` | 2 | 1 | 1 | 0 | 0 |
| `trailer_views` | 3 | 1 | 0 | 0 | 2 |
| `user_2fa` | 5 | 1 | 2 | 0 | 2 |
| `user_contributions` | 4 | 1 | 0 | 0 | 3 |
| `user_favorites` | 5 | 1 | 1 | 0 | 3 |
| `user_follows` | 3 | 1 | 0 | 0 | 2 |
| `user_reports` | 7 | 1 | 1 | 0 | 5 |
| `user_roles` | 1 | 0 | 1 | 0 | 0 |
| `users` | 9 | 1 | 3 | 0 | 5 |
| `voice_actors` | 4 | 1 | 1 | 0 | 2 |

---

# 📋 Detalle por Tabla

## `action_points`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `action_points_pkey` | 🔑 PK | action | Identificador único |

## `alternative_titles`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `alternative_titles_pkey` | 🔑 PK | id | Identificador único |
| `alternative_titles_titleable_type_titleable_id_language_tex_key` | 🔒 UQ | titleable_type, titleable_id, language, text | Garantiza unicidad |
| `idx_titles_polymorphic` | 🌳 BT | titleable_type, titleable_id | Consultas polimórficas |

## `anime`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `anime_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `anime_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `anime_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `anime_pkey` | 🔑 PK | id | Identificador único |
| `anime_slug_key` | 🔒 UQ | slug | Búsqueda por URL |
| `idx_anime_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_anime_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_anime_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_anime_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_anime_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_anime_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_anime_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |

## `audit_log`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `audit_log_pkey` | 🔑 PK | id | Identificador único |

## `character_voice_actors`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `character_voice_actors_pkey` | 🔑 PK | character_id, voice_actor_id, media_type, media_id | Identificador único |

## `characterable_characters`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `characterable_characters_pkey` | 🔑 PK | character_id, characterable_type, characterable_id | Identificador único |

## `characters`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `characters_pkey` | 🔑 PK | id | Identificador único |
| `characters_slug_key` | 🔒 UQ | slug | Búsqueda por URL |
| `idx_characters_favorites` | 🌳 BT | favorites_count DESC | Ordenamiento descendente |

## `comment_reactions`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `comment_reactions_pkey` | 🔑 PK | comment_id, user_id | Consultas por usuario |

## `comment_reports`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `comment_reports_comment_id_reporter_user_id_key` | 🔒 UQ | comment_id, reporter_user_id | Consultas por usuario |
| `comment_reports_pkey` | 🔑 PK | id | Identificador único |
| `idx_comment_reports_assigned` | 🌳 BT | assigned_to | Búsqueda |
| `idx_comment_reports_comment_id` | 🌳 BT | comment_id | Búsqueda |
| `idx_comment_reports_created` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_comment_reports_reported_user` | 🌳 BT | reported_user_id | Consultas por usuario |
| `idx_comment_reports_reporter` | 🌳 BT | reporter_user_id | Consultas por usuario |
| `idx_comment_reports_status` | 🌳 BT | status | Filtro por estado |

## `comments`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `comments_pkey` | 🔑 PK | id | Identificador único |
| `idx_comments_created_at` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_comments_likes` | 🌳 BT | likes_count DESC | Ordenamiento descendente |
| `idx_comments_polymorphic` | 🌳 BT | commentable_type, commentable_id | Consultas polimórficas |
| `idx_comments_user` | 🌳 BT | user_id | Consultas por usuario |
| `idx_comments_with_images` | 🌳 BT | ((jsonb_array_length(images | Búsqueda |

## `content_contributions`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `content_contributions_pkey` | 🔑 PK | id | Identificador único |
| `idx_content_contributions_assigned` | 🌳 BT | assigned_to_user_id | Consultas por usuario |
| `idx_content_contributions_contributable` | 🌳 BT | contributable_type, contributable_id | Búsqueda |
| `idx_content_contributions_contributor` | 🌳 BT | contributor_user_id | Consultas por usuario |
| `idx_content_contributions_created` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_content_contributions_status` | 🌳 BT | status | Filtro por estado |

## `content_reports`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `content_reports_pkey` | 🔑 PK | id | Identificador único |
| `idx_content_reports_assigned` | 🌳 BT | assigned_to | Búsqueda |
| `idx_content_reports_created` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_content_reports_reportable` | 🌳 BT | reportable_type, reportable_id | Búsqueda |
| `idx_content_reports_reported_by` | 🌳 BT | reported_by | Búsqueda |
| `idx_content_reports_status` | 🌳 BT | status | Filtro por estado |

## `donghua`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `dougua_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `dougua_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `dougua_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `dougua_pkey` | 🔑 PK | id | Identificador único |
| `dougua_slug_key` | 🔒 UQ | slug | Búsqueda por URL |
| `idx_donghua_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_donghua_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_donghua_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_donghua_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_donghua_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_donghua_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_donghua_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |

## `episodes`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `episodes_anime_id_episode_number_key` | 🔒 UQ | anime_id, episode_number | Garantiza unicidad |
| `episodes_pkey` | 🔑 PK | id | Identificador único |
| `idx_episodes_air_date` | 🌳 BT | air_date | Búsqueda |
| `idx_episodes_anime_id` | 🌳 BT | anime_id | Búsqueda |

## `external_links`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `external_links_pkey` | 🔑 PK | id | Identificador único |
| `idx_external_links_media` | 🌳 BT | linkable_type, linkable_id | Búsqueda |

## `fan_comics`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `fan_comics_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `fan_comics_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `fan_comics_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `fan_comics_pkey` | 🔑 PK | id | Identificador único |
| `fan_comics_slug_key` | 🔒 UQ | slug | Búsqueda por URL |
| `idx_fan_comics_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_fan_comics_created_by` | 🌳 BT | created_by | Búsqueda |
| `idx_fan_comics_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_fan_comics_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_fan_comics_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_fan_comics_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_fan_comics_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_fan_comics_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |

## `genres`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `genres_code_key` | 🔒 UQ | code | Garantiza unicidad |
| `genres_pkey` | 🔑 PK | id | Identificador único |

## `list_items`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_list_items_listid` | 🌳 BT | list_id | Búsqueda |
| `idx_list_items_status` | 🌳 BT | status, listable_type | Filtro por estado |
| `idx_list_items_user_media` | 🌳 BT | list_id, listable_type, listable_id | Búsqueda |
| `idx_user_lists_user_status` | 🌳 BT | listable_type, listable_id | Búsqueda |
| `list_items_list_id_listable_type_listable_id_key` | 🔒 UQ | list_id, listable_type, listable_id | Garantiza unicidad |
| `list_items_pkey` | 🔑 PK | id | Identificador único |

## `lists`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_lists_userid` | 🌳 BT | user_id | Consultas por usuario |
| `lists_pkey` | 🔑 PK | id | Identificador único |
| `lists_user_id_slug_key` | 🔒 UQ | user_id, slug | Búsqueda por URL |

## `login_attempts`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_login_attempts_email_ip` | 🔍 GIN | email, ip_address, attempted_at | Full-text search |
| `login_attempts_pkey` | 🔑 PK | id | Identificador único |

## `manga`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_manga_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_manga_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_manga_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_manga_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_manga_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_manga_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_manga_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |
| `manga_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `manga_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `manga_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `manga_pkey` | 🔑 PK | id | Identificador único |
| `manga_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

## `manhua`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_manhua_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_manhua_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_manhua_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_manhua_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_manhua_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_manhua_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_manhua_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |
| `manhua_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `manhua_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `manhua_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `manhua_pkey` | 🔑 PK | id | Identificador único |
| `manhua_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

## `manhwa`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_manhwa_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_manhwa_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_manhwa_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_manhwa_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_manhwa_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_manhwa_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_manhwa_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |
| `manhwa_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `manhwa_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `manhwa_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `manhwa_pkey` | 🔑 PK | id | Identificador único |
| `manhwa_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

## `media_genres`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `media_genres_pkey` | 🔑 PK | id | Identificador único |
| `media_genres_titleable_type_titleable_id_genre_id_key` | 🔒 UQ | titleable_type, titleable_id, genre_id | Garantiza unicidad |

## `media_relations`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_media_relations_source` | 🌳 BT | source_type, source_id | Búsqueda |
| `idx_media_relations_target` | 🌳 BT | target_type, target_id | Búsqueda |
| `idx_media_relations_type` | 🌳 BT | relation_type | Búsqueda |
| `media_relations_pkey` | 🔑 PK | id | Identificador único |
| `media_relations_unique_relation` | 🔒 UQ | source_type, source_id, target_type, target_id | Garantiza unicidad |

## `media_statuses`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `media_statuses_code_key` | 🔒 UQ | code | Garantiza unicidad |
| `media_statuses_pkey` | 🔑 PK | id | Identificador único |

## `media_trailers`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_trailers_polymorphic` | 🌳 BT | mediable_type, mediable_id | Consultas polimórficas |
| `idx_trailers_views` | 🌳 BT | views_count DESC | Ordenamiento descendente |
| `media_trailers_pkey` | 🔑 PK | id | Identificador único |

## `notifications`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_notifications_action_type` | 🌳 BT | action_type, created_at DESC | Filtro por fecha |
| `idx_notifications_notifiable` | 🌳 BT | notifiable_type, notifiable_id | Búsqueda |
| `idx_notifications_recipient` | 🌳 BT | recipient_user_id, read_at | Consultas por usuario |
| `idx_notifications_unread` | 🌳 BT | recipient_user_id, created_at DESC | Consultas por usuario |
| `notifications_pkey` | 🔑 PK | id | Identificador único |

## `novels`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_novels_anilist_id` | 🌳 BT | anilist_id | Búsqueda |
| `idx_novels_favourites` | 🌳 BT | favourites DESC | Ordenamiento descendente |
| `idx_novels_mal_id` | 🌳 BT | mal_id | Búsqueda |
| `idx_novels_popularity` | 🌳 BT | popularity DESC | Ordenamiento descendente |
| `idx_novels_ranking_score` | 🌳 BT | average_score DESC, ratings_count DESC | Ordenamiento descendente |
| `idx_novels_status_id` | 🌳 BT | status_id | Filtro por estado |
| `idx_novels_title_search` | 🔍 GIN | to_tsvector('english'::regconfig, (title_english | Búsqueda de texto |
| `novels_anilist_id_key` | 🔒 UQ | anilist_id | Garantiza unicidad |
| `novels_kitsu_id_key` | 🔒 UQ | kitsu_id | Garantiza unicidad |
| `novels_mal_id_key` | 🔒 UQ | mal_id | Garantiza unicidad |
| `novels_pkey` | 🔑 PK | id | Identificador único |
| `novels_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

## `oauth_accounts`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_oauth_accounts_provider` | 🌳 BT | provider, provider_account_id | Búsqueda |
| `idx_oauth_accounts_user_id` | 🌳 BT | user_id | Consultas por usuario |
| `oauth_accounts_pkey` | 🔑 PK | id | Identificador único |
| `oauth_accounts_provider_provider_account_id_key` | 🔒 UQ | provider, provider_account_id | Garantiza unicidad |

## `password_reset_tokens`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_password_reset_tokens_method` | 🌳 BT | recovery_method | Búsqueda |
| `idx_password_reset_tokens_token` | 🌳 BT | token | Búsqueda |
| `idx_password_reset_tokens_user_id` | 🌳 BT | user_id | Consultas por usuario |
| `password_reset_tokens_pkey` | 🔑 PK | id | Identificador único |
| `password_reset_tokens_token_key` | 🔒 UQ | token | Garantiza unicidad |

## `permissions`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `permissions_name_key` | 🔒 UQ | name | Garantiza unicidad |
| `permissions_pkey` | 🔑 PK | id | Identificador único |

## `rankings_cache`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_rankings_cache_lookup` | 🌳 BT | ranking_type, media_type, expires_at | Búsqueda |
| `rankings_cache_pkey` | 🔑 PK | id | Identificador único |
| `rankings_cache_ranking_type_media_type_rank_position_key` | 🔒 UQ | ranking_type, media_type, rank_position | Garantiza unicidad |

## `recovery_codes`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_recovery_codes_code` | 🌳 BT | code | Búsqueda |
| `idx_recovery_codes_user_id` | 🌳 BT | user_id | Consultas por usuario |
| `recovery_codes_code_key` | 🔒 UQ | code | Garantiza unicidad |
| `recovery_codes_pkey` | 🔑 PK | id | Identificador único |
| `recovery_codes_user_id_key` | 🔒 UQ | user_id | Consultas por usuario |

## `review_reports`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_review_reports_assigned` | 🌳 BT | assigned_to | Búsqueda |
| `idx_review_reports_created` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_review_reports_reported_user` | 🌳 BT | reported_user_id | Consultas por usuario |
| `idx_review_reports_reporter` | 🌳 BT | reporter_user_id | Consultas por usuario |
| `idx_review_reports_review_id` | 🌳 BT | review_id | Búsqueda |
| `idx_review_reports_status` | 🌳 BT | status | Filtro por estado |
| `review_reports_pkey` | 🔑 PK | id | Identificador único |
| `review_reports_review_id_reporter_user_id_key` | 🔒 UQ | review_id, reporter_user_id | Consultas por usuario |

## `review_votes`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `review_votes_pkey` | 🔑 PK | review_id, user_id | Consultas por usuario |

## `reviews`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_reviews_created_at` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_reviews_helpful` | 🌳 BT | helpful_votes DESC | Ordenamiento descendente |
| `idx_reviews_polymorphic` | 🌳 BT | reviewable_type, reviewable_id | Consultas polimórficas |
| `idx_reviews_user` | 🌳 BT | user_id | Consultas por usuario |
| `idx_reviews_user_unique` | 🔒 UQ | user_id, reviewable_type, reviewable_id | Consultas por usuario |
| `reviews_pkey` | 🔑 PK | id | Identificador único |

## `role_permissions`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `role_permissions_pkey` | 🔑 PK | role_id, permission_id | Identificador único |

## `roles`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `roles_name_key` | 🔒 UQ | name | Garantiza unicidad |
| `roles_pkey` | 🔑 PK | id | Identificador único |

## `staff`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_staff_favorites` | 🌳 BT | favorites_count DESC | Ordenamiento descendente |
| `idx_staff_slug` | 🌳 BT | slug | Búsqueda por URL |
| `staff_pkey` | 🔑 PK | id | Identificador único |
| `staff_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

## `staffable_staff`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `staffable_staff_pkey` | 🔑 PK | staff_id, staffable_type, staffable_id, role | Identificador único |

## `studiable_studios`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `studiable_studios_pkey` | 🔑 PK | studio_id, studiable_type, studiable_id | Identificador único |

## `studios`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `studios_name_key` | 🔒 UQ | name | Garantiza unicidad |
| `studios_pkey` | 🔑 PK | id | Identificador único |

## `taggable_tags`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `taggable_tags_pkey` | 🔑 PK | tag_id, taggable_type, taggable_id | Identificador único |

## `tags`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `tags_name_key` | 🔒 UQ | name | Garantiza unicidad |
| `tags_pkey` | 🔑 PK | id | Identificador único |

## `trailer_views`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_trailer_views_session` | 🌳 BT | session_id, trailer_id | Búsqueda |
| `idx_trailer_views_trailer` | 🌳 BT | trailer_id | Búsqueda |
| `trailer_views_pkey` | 🔑 PK | id | Identificador único |

## `user_2fa`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_user_2fa_recovery_code` | 🌳 BT | recovery_code | Búsqueda |
| `idx_user_2fa_user_id` | 🌳 BT | user_id | Consultas por usuario |
| `user_2fa_pkey` | 🔑 PK | id | Identificador único |
| `user_2fa_recovery_code_key` | 🔒 UQ | recovery_code | Garantiza unicidad |
| `user_2fa_user_id_key` | 🔒 UQ | user_id | Consultas por usuario |

## `user_contributions`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_user_contrib_status` | 🌳 BT | status | Filtro por estado |
| `idx_user_contrib_userid` | 🌳 BT | user_id | Consultas por usuario |
| `idx_user_contributions_assigned` | 🌳 BT | assigned_to | Búsqueda |
| `user_contributions_pkey` | 🔑 PK | id | Identificador único |

## `user_favorites`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_user_favorites_polymorphic` | 🌳 BT | favorable_type, favorable_id | Consultas polimórficas |
| `idx_user_favorites_public` | 🌳 BT | user_id, is_public | Consultas por usuario |
| `idx_user_favorites_user` | 🌳 BT | user_id | Consultas por usuario |
| `user_favorites_pkey` | 🔑 PK | id | Identificador único |
| `user_favorites_user_id_favorable_type_favorable_id_key` | 🔒 UQ | user_id, favorable_type, favorable_id | Consultas por usuario |

## `user_follows`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_user_follows_follower` | 🌳 BT | follower_id | Búsqueda |
| `idx_user_follows_following` | 🌳 BT | following_id | Búsqueda |
| `user_follows_pkey` | 🔑 PK | follower_id, following_id | Identificador único |

## `user_reports`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_user_reports_assigned` | 🌳 BT | assigned_to | Búsqueda |
| `idx_user_reports_created` | 🌳 BT | created_at DESC | Filtro por fecha |
| `idx_user_reports_reported_user` | 🌳 BT | reported_user_id | Consultas por usuario |
| `idx_user_reports_reporter` | 🌳 BT | reporter_user_id | Consultas por usuario |
| `idx_user_reports_status` | 🌳 BT | status | Filtro por estado |
| `user_reports_pkey` | 🔑 PK | id | Identificador único |
| `user_reports_reported_user_id_reporter_user_id_reason_key` | 🔒 UQ | reported_user_id, reporter_user_id, reason | Consultas por usuario |

## `user_roles`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `user_roles_user_id_role_id_key` | 🔒 UQ | user_id, role_id | Consultas por usuario |

## `users`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_users_email` | 🌳 BT | email | Búsqueda |
| `idx_users_email_verification_token` | 🌳 BT | email_verification_token | Búsqueda |
| `idx_users_tracking_id` | 🌳 BT | tracking_id | Búsqueda |
| `idx_users_username` | 🌳 BT | username | Búsqueda |
| `idx_users_uuid` | 🌳 BT | uuid | Búsqueda |
| `users_email_key` | 🔒 UQ | email | Garantiza unicidad |
| `users_pkey` | 🔑 PK | id | Identificador único |
| `users_tracking_id_key` | 🔒 UQ | tracking_id | Garantiza unicidad |
| `users_username_key` | 🔒 UQ | username | Garantiza unicidad |

## `voice_actors`

| Índice | Tipo | Columnas | Propósito |
|--------|:----:|----------|----------|
| `idx_voice_actors_favorites` | 🌳 BT | favorites_count DESC | Ordenamiento descendente |
| `idx_voice_actors_language` | 🌳 BT | language | Búsqueda |
| `voice_actors_pkey` | 🔑 PK | id | Identificador único |
| `voice_actors_slug_key` | 🔒 UQ | slug | Búsqueda por URL |

---

## 📖 Guía de Tipos de Índices

| Tipo | Símbolo | Descripción | Cuándo usar |
|------|:-------:|-------------|-------------|
| **Primary Key** | 🔑 | Identificador único de fila | Automático en columna `id` |
| **Unique** | 🔒 | Garantiza valores únicos | Emails, usernames, slugs |
| **B-Tree** | 🌳 | Árbol balanceado | Comparaciones: =, <, >, BETWEEN |
| **GIN** | 🔍 | Generalized Inverted Index | Full-text search, arrays, JSONB |

## 🎯 Patrones de Índices en Chirisu

### Índices de Performance
- `idx_{tabla}_popularity` - Ordenar por popularidad DESC
- `idx_{tabla}_ranking_score` - Ordenar por ranking
- `idx_{tabla}_created_at` - Filtrar contenido reciente

### Índices de Unicidad
- `{tabla}_slug_key` - URLs únicas
- `{tabla}_mal_id_key` - IDs de MyAnimeList únicos
- `{tabla}_anilist_id_key` - IDs de AniList únicos

### Índices Polimórficos
- `idx_{tabla}_polymorphic` - Combina (media_type, media_id) para consultas eficientes

### Índices de Búsqueda
- `idx_{tabla}_title_search` - GIN para búsqueda full-text en títulos

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** 26 de noviembre de 2025
