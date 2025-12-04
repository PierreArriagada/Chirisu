# ⚡ Base de Datos - Triggers y Funciones

Documentación de la lógica de negocio implementada en PostgreSQL.

**Total triggers:** 85  
**Total funciones:** 51

---

## 📋 Índice

1. [Triggers por Tabla](#-triggers-por-tabla)
2. [Funciones Principales](#-funciones-principales)
3. [Detalle de Funciones Críticas](#-detalle-de-funciones-críticas)

---

# 🔔 Triggers por Tabla

## `anime`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_anime_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Recalcula popularidad del anime cuando cambian favoritos/listas |
| `trg_anime_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Recalcula popularidad del anime cuando cambian favoritos/listas |
| `trg_anime_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking_score basado en average_score y ratings_count |
| `trg_set_anime_slug` | INSERT | BEFORE | `fn_anime_set_slug` | Genera slug automático desde el título (ej: "Attack on Titan" → "attack-on-titan") |
| `trg_set_anime_slug` | UPDATE | BEFORE | `fn_anime_set_slug` | Genera slug automático desde el título (ej: "Attack on Titan" → "attack-on-titan") |

## `comment_reactions`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_comment_reaction_delete` | DELETE | AFTER | `fn_update_comment_likes` | Resta likes/dislikes al eliminar reacción |
| `trg_comment_reaction_insert` | INSERT | AFTER | `fn_update_comment_likes` | Suma likes/dislikes al crear reacción |

## `comment_reports`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_notify_new_comment_report` | INSERT | AFTER | `fn_notify_new_comment_report` | Notifica a moderadores cuando se reporta un comentario |

## `comments`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_comment_delete_update_replies` | UPDATE | AFTER | `fn_update_comment_replies` | Actualiza contador de respuestas al eliminar comentario |
| `trg_comment_insert_update_replies` | INSERT | AFTER | `fn_update_comment_replies` | Actualiza contador de respuestas al crear comentario |
| `trg_comments_update_time` | UPDATE | BEFORE | `fn_update_updated_at` | Actualiza updated_at automáticamente |
| `trg_insert_comment` | INSERT | AFTER | `trg_comment_insert` | Trigger post-insert para comentarios |

## `content_contributions`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_apply_approved_contribution` | UPDATE | AFTER | `fn_apply_approved_contribution` | CRÍTICO: Aplica cambios a la tabla destino cuando se aprueba una contribución |
| `trg_notify_contributor_review` | UPDATE | AFTER | `fn_notify_contributor_review` | Notifica al usuario cuando su contribución es revisada |
| `trg_notify_moderators_new_contribution` | INSERT | AFTER | `fn_notify_moderators_new_contribution` | Notifica a moderadores sobre nuevas contribuciones pendientes |
| `trg_notify_mods_contribution` | INSERT | AFTER | `fn_notify_moderators_new_contribution` |  |
| `trg_update_contribution_timestamp` | UPDATE | BEFORE | `fn_update_contribution_timestamp` | Actualiza timestamp al modificar contribución |

## `content_reports`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_content_reports_update_timestamp` | UPDATE | BEFORE | `fn_update_content_report_timestamp` | Actualiza timestamp de reportes de contenido |
| `trg_notify_moderators_new_report` | INSERT | AFTER | `fn_notify_moderators_new_report` | Notifica a mods sobre nuevos reportes |
| `trg_notify_new_report` | INSERT | AFTER | `fn_notify_new_report` | Notifica sobre nuevos reportes |
| `trg_notify_reporter_resolution` | UPDATE | AFTER | `fn_notify_reporter_resolution` | Notifica al reportante cuando se resuelve su reporte |

## `donghua`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_donghua_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Similar a anime - actualiza popularidad |
| `trg_donghua_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Similar a anime - actualiza popularidad |
| `trg_donghua_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Similar a anime - actualiza ranking |
| `trg_donghua_update_time` | UPDATE | BEFORE | `fn_update_updated_at` | Actualiza updated_at |
| `trg_set_donghua_slug` | INSERT | BEFORE | `fn_donghua_set_slug` | Genera slug para donghua |
| `trg_set_donghua_slug` | UPDATE | BEFORE | `fn_donghua_set_slug` | Genera slug para donghua |
| `trg_set_donghua_status_default` | INSERT | BEFORE | `fn_set_default_anime_status` | Establece status por defecto al crear |

## `episodes`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_episodes_update_time` | UPDATE | BEFORE | `fn_update_updated_at` | Actualiza updated_at de episodios |

## `fan_comics`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_fan_comics_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Actualiza popularidad de fan comics |
| `trg_fan_comics_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Actualiza popularidad de fan comics |
| `trg_fan_comics_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking de fan comics |
| `trg_fan_comics_update_time` | UPDATE | BEFORE | `fn_update_updated_at` |  |
| `trg_set_fan_comics_slug` | UPDATE | BEFORE | `fn_fan_comics_set_slug` | Genera slug |
| `trg_set_fan_comics_slug` | INSERT | BEFORE | `fn_fan_comics_set_slug` | Genera slug |
| `trg_set_fan_comics_status_default` | INSERT | BEFORE | `fn_set_default_publishing_status` |  |

## `list_items`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_insert_list_item` | INSERT | AFTER | `trg_list_item_insert` |  |
| `trg_list_items_delete_update_popularity` | DELETE | AFTER | `fn_update_list_item_popularity` |  |
| `trg_list_items_insert_update_popularity` | INSERT | AFTER | `fn_update_list_item_popularity` |  |

## `lists`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_lists_update_time` | UPDATE | BEFORE | `fn_update_updated_at` | Actualiza updated_at de listas |

## `manga`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_manga_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manga |
| `trg_manga_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manga |
| `trg_manga_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking de manga |
| `trg_set_manga_slug` | UPDATE | BEFORE | `fn_manga_set_slug` | Genera slug para manga |
| `trg_set_manga_slug` | INSERT | BEFORE | `fn_manga_set_slug` | Genera slug para manga |

## `manhua`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_manhua_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manhua |
| `trg_manhua_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manhua |
| `trg_manhua_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking de manhua |
| `trg_manhua_update_time` | UPDATE | BEFORE | `fn_update_updated_at` |  |
| `trg_set_manhua_slug` | INSERT | BEFORE | `fn_manhua_set_slug` | Genera slug para manhua |
| `trg_set_manhua_slug` | UPDATE | BEFORE | `fn_manhua_set_slug` | Genera slug para manhua |
| `trg_set_manhua_status_default` | INSERT | BEFORE | `fn_set_default_publishing_status` |  |

## `manhwa`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_manhwa_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manhwa |
| `trg_manhwa_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Actualiza popularidad de manhwa |
| `trg_manhwa_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking de manhwa |
| `trg_manhwa_update_time` | UPDATE | BEFORE | `fn_update_updated_at` |  |
| `trg_set_manhwa_slug` | INSERT | BEFORE | `fn_manhwa_set_slug` | Genera slug para manhwa |
| `trg_set_manhwa_slug` | UPDATE | BEFORE | `fn_manhwa_set_slug` | Genera slug para manhwa |
| `trg_set_manhwa_status_default` | INSERT | BEFORE | `fn_set_default_publishing_status` |  |

## `novels`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_novels_update_popularity` | UPDATE | AFTER | `fn_update_media_popularity` | Actualiza popularidad de novelas |
| `trg_novels_update_popularity` | INSERT | AFTER | `fn_update_media_popularity` | Actualiza popularidad de novelas |
| `trg_novels_update_ranking` | UPDATE | BEFORE | `fn_update_media_ranking` | Actualiza ranking de novelas |
| `trg_set_novel_slug` | INSERT | BEFORE | `fn_novel_set_slug` |  |
| `trg_set_novel_slug` | UPDATE | BEFORE | `fn_novel_set_slug` |  |

## `review_reports`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_notify_new_review_report` | INSERT | AFTER | `fn_notify_new_review_report` | Notifica sobre reportes de reseñas |

## `review_votes`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_review_vote_delete` | DELETE | AFTER | `fn_update_review_helpful_votes` |  |
| `trg_review_vote_insert` | INSERT | AFTER | `fn_update_review_helpful_votes` |  |
| `trg_review_vote_update` | UPDATE | AFTER | `fn_update_review_helpful_votes` |  |

## `reviews`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_insert_review` | INSERT | AFTER | `trg_review_insert` |  |
| `trg_review_delete_update_stats` | UPDATE | AFTER | `fn_update_media_review_stats` |  |
| `trg_review_insert_update_stats` | INSERT | AFTER | `fn_update_media_review_stats` |  |
| `trg_review_update_update_stats` | UPDATE | AFTER | `fn_update_media_review_stats` |  |
| `trg_reviews_update_time` | UPDATE | BEFORE | `fn_update_updated_at` |  |

## `user_contributions`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_apply_contribution` | UPDATE | AFTER | `fn_apply_approved_contribution` |  |
| `trg_notify_contribution_status` | UPDATE | AFTER | `fn_notify_contribution_status_change` |  |
| `trg_notify_contributor` | UPDATE | AFTER | `fn_notify_contributor_review` |  |
| `trg_notify_mods_contribution` | INSERT | AFTER | `fn_notify_moderators_new_contribution` |  |
| `trg_notify_new_contribution` | INSERT | AFTER | `fn_notify_new_contribution` |  |
| `trg_user_contrib_approved` | UPDATE | AFTER | `trg_contribution_approved` |  |

## `user_follows`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_user_follow_delete` | DELETE | AFTER | `fn_update_user_follows_count` |  |
| `trg_user_follow_insert` | INSERT | AFTER | `fn_update_user_follows_count` |  |

## `user_reports`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_notify_new_user_report` | INSERT | AFTER | `fn_notify_new_user_report` |  |

## `users`

| Trigger | Evento | Timing | Función | Descripción |
|---------|--------|--------|---------|-------------|
| `trg_recalc_level` | UPDATE | BEFORE | `trg_users_recalc_level` |  |
| `trg_users_update_time` | UPDATE | BEFORE | `fn_update_updated_at` |  |
| `trigger_assign_tracking_id` | INSERT | BEFORE | `assign_tracking_id` |  |

---

# 🔧 Funciones Principales

| Función | Argumentos | Retorna | Descripción |
|---------|------------|---------|-------------|
| `assign_tracking_id` | - | trigger |  |
| `find_user_by_recovery_code` | recovery_code_input charact... | TABLE(user_id integer, username character varying, email character varying, is_active boolean, has_2fa boolean, backup_codes_count integer) |  |
| `fn_anime_set_slug` | - | trigger |  |
| `fn_apply_approved_contribution` | - | trigger | CRÍTICO: Ejecuta UPDATE dinámico para aplicar cambios aprobados a la tabla destino |
| `fn_apply_contribution_field_changes` | p_table_name text, p_record... | void |  |
| `fn_apply_contribution_relation_changes` | p_contributable_type text, ... | void |  |
| `fn_award_points` | p_user_id bigint, p_points ... | void | Suma puntos al usuario según tipo de acción realizada |
| `fn_cleanup_old_notifications` | - | integer |  |
| `fn_donghua_set_slug` | - | trigger |  |
| `fn_fan_comics_set_slug` | - | trigger |  |
| `fn_manga_set_slug` | - | trigger |  |
| `fn_manhua_set_slug` | - | trigger |  |
| `fn_manhwa_set_slug` | - | trigger |  |
| `fn_notify_contribution_status_change` | - | trigger |  |
| `fn_notify_contributor_review` | - | trigger | Notifica al contribuyente el resultado de su contribución |
| `fn_notify_moderators_new_contribution` | - | trigger | Crea notificaciones para moderadores cuando hay nueva contribución |
| `fn_notify_moderators_new_report` | - | trigger |  |
| `fn_notify_new_comment_report` | - | trigger |  |
| `fn_notify_new_contribution` | - | trigger |  |
| `fn_notify_new_report` | - | trigger |  |
| `fn_notify_new_review_report` | - | trigger |  |
| `fn_notify_new_user_report` | - | trigger |  |
| `fn_notify_reporter_resolution` | - | trigger |  |
| `fn_novel_set_slug` | - | trigger |  |
| `fn_recalc_level` | points_value bigint | integer |  |
| `fn_recalculate_all_rankings` | - | void | Recalcula rankings de todas las tablas de media |
| `fn_set_default_anime_status` | - | trigger |  |
| `fn_set_default_publishing_status` | - | trigger |  |
| `fn_update_comment_likes` | - | trigger | Actualiza contadores de likes/dislikes en comentarios |
| `fn_update_comment_replies` | - | trigger | Actualiza contador de respuestas en comentarios |
| `fn_update_content_report_timestamp` | - | trigger |  |
| `fn_update_contribution_timestamp` | - | trigger |  |
| `fn_update_list_item_popularity` | - | trigger |  |
| `fn_update_media_popularity` | - | trigger | Calcula popularidad basada en favoritos y listas |
| `fn_update_media_ranking` | - | trigger | Calcula ranking_score para ordenamiento |
| `fn_update_media_review_stats` | - | trigger | Recalcula average_score y ratings_count de un media |
| `fn_update_review_helpful_votes` | - | trigger |  |
| `fn_update_updated_at` | - | trigger | Función genérica para actualizar campo updated_at |
| `fn_update_user_follows_count` | - | trigger |  |
| `fn_upsert_anime_from_external` | p_mal_id bigint, p_anilist_... | bigint |  |
| `generate_slug` | input_title text | character varying | Convierte texto a slug URL-friendly |
| `generate_tracking_id` | - | character varying |  |
| `generate_unique_tracking_id` | - | character varying |  |
| `get_top_trailers_daily` | p_limit integer DEFAULT 6 | TABLE(trailer_id bigint, title character varying, thumbnail_url character varying, url text, views_count integer, media_title character varying, media_id bigint, media_type character varying) |  |
| `is_in_favorites` | p_user_id bigint, p_item_ty... | boolean |  |
| `refresh_all_ranking_views` | - | void |  |
| `trg_comment_insert` | - | trigger |  |
| `trg_contribution_approved` | - | trigger |  |
| `trg_list_item_insert` | - | trigger |  |
| `trg_review_insert` | - | trigger |  |
| `trg_users_recalc_level` | - | trigger |  |

---

# 📝 Detalle de Funciones Críticas

## `fn_apply_approved_contribution`

> CRÍTICO: Ejecuta UPDATE dinámico para aplicar cambios aprobados a la tabla destino

**Argumentos:** `ninguno`  
**Retorna:** `trigger`

```sql
CREATE OR REPLACE FUNCTION app.fn_apply_approved_contribution()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      table_name TEXT;
      table_map JSONB := '{
        "anime": "anime",
        "manga": "manga",
        "novel": "novels",
        "donghua": "donghua",
        "manhua": "manhua",
        "manhwa": "manhwa",
        "fan_comic": "fan_comics"
      }'::JSONB;
    BEGIN
      -- Solo procesar si el estado cambió a 'approved'
      IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Obtener nombre de tabla según el tipo
        table_name := table_map->>NEW.contributable_type;

        IF table_name IS NULL THEN
          RAISE EXCEPTION 'Tipo de contributable no válido: %', NEW.contributable_type;
        END IF;

        RAISE NOTICE 'Aplicando contribución % para % (ID: %)',
                      NEW.contribution_type, NEW.contributable_type, NEW.contributable_id;

        -- Aplicar cambios en campos simples (especificando esquema app)
        IF NEW.proposed_changes IS NOT NULL THEN
          PERFORM app.fn_apply_contribution_field_changes(
            table_name,
            NEW.contributable_id::INTEGER,
            NEW.proposed_changes
          );

          -- Aplicar cambios en relaciones (especificando esquema app)
          PERFORM app.fn_apply_contribution_relation_changes(
            NEW.contributable_type,
            NEW.contributable_id::INTEGER,
            NEW.proposed_changes
          );
        END IF;

        RAISE NOTICE 'Contribución aplicada exitosamente';
      END IF;

      RETURN NEW;
    END;
    $function$

```

---

## `fn_notify_moderators_new_contribution`

> Crea notificaciones para moderadores cuando hay nueva contribución

**Argumentos:** `ninguno`  
**Retorna:** `trigger`

```sql
CREATE OR REPLACE FUNCTION app.fn_notify_moderators_new_contribution()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
  media_type_label TEXT;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Obtener etiqueta del tipo de medio
  media_type_label := CASE NEW.contributable_type
    WHEN 'anime' THEN 'Anime'
    WHEN 'manga' THEN 'Manga'
    WHEN 'novel' THEN 'Novela'
    WHEN 'donghua' THEN 'Donghua'
    WHEN 'manhua' THEN 'Manhua'
    WHEN 'manhwa' THEN 'Manhwa'
    WHEN 'fan_comic' THEN 'Fan Comic'
    ELSE NEW.contributable_type
  END;

  -- Notificar a todos los admins y moderadores
  FOR admin_mod_record IN
    SELECT DISTINCT u.id
    FROM app.users u
    INNER JOIN app.user_roles ur ON u.id = ur.user_id
    INNER JOIN app.roles r ON ur.role_id = r.id
    WHERE r.name IN ('admin', 'moderator')
      AND u.is_active = TRUE
      AND u.id != NEW.contributor_user_id  -- âœ… CORREGIDO
  LOOP
    INSERT INTO app.notifications (
      recipient_user_id,
      actor_user_id,
      action_type,
      notifiable_type,
      notifiable_id
    ) VALUES (
      admin_mod_record.id,
      NEW.contributor_user_id,  -- âœ… CORREGIDO
      'contribution_submitted',
      NEW.contributable_type,
      NEW.id
    );
    
    notification_count := notification_count + 1;
  END LOOP;

  RAISE NOTICE 'Se enviaron % notificaciones a administradores y moderadores', notification_count;
  
  RETURN NEW;
END;
$function$

```

---

## `fn_notify_contributor_review`

> Notifica al contribuyente el resultado de su contribución

**Argumentos:** `ninguno`  
**Retorna:** `trigger`

```sql
CREATE OR REPLACE FUNCTION app.fn_notify_contributor_review()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  action_type_value TEXT;
  media_type_label TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Solo notificar si el estado cambiÃ³ a 'approved' o 'rejected'
  IF NEW.status NOT IN ('approved', 'rejected') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Obtener etiqueta del tipo de medio
  media_type_label := CASE NEW.contributable_type
    WHEN 'anime' THEN 'Anime'
    WHEN 'manga' THEN 'Manga'
    WHEN 'novel' THEN 'Novela'
    WHEN 'donghua' THEN 'Donghua'
    WHEN 'manhua' THEN 'Manhua'
    WHEN 'manhwa' THEN 'Manhwa'
    WHEN 'fan_comic' THEN 'Fan Comic'
    ELSE NEW.contributable_type
  END;

  -- Determinar tipo de acciÃ³n
  action_type_value := CASE NEW.status
    WHEN 'approved' THEN 'contribution_approved'
    WHEN 'rejected' THEN 'contribution_rejected'
    ELSE NULL
  END;

  -- Solo notificar al contribuyente original
  IF action_type_value IS NOT NULL AND NEW.reviewed_by_user_id IS NOT NULL THEN
    INSERT INTO app.notifications (
      recipient_user_id,
      actor_user_id,
      action_type,
      notifiable_type,
      notifiable_id
    ) VALUES (
      NEW.contributor_user_id,  -- âœ… CORREGIDO
      NEW.reviewed_by_user_id,
      action_type_value,
      NEW.contributable_type,
      NEW.contributable_id
    );
    
    RAISE NOTICE 'NotificaciÃ³n enviada al contribuyente: % (contribuciÃ³n %)', 
      NEW.contributor_user_id, NEW.status;
  END IF;

  RETURN NEW;
END;
$function$

```

---

## `fn_award_points`

> Suma puntos al usuario según tipo de acción realizada

**Argumentos:** `p_user_id bigint, p_points integer, p_action character varying, p_resource_type character varying DEFAULT NULL::character varying, p_resource_id bigint DEFAULT NULL::bigint`  
**Retorna:** `void`

```sql
CREATE OR REPLACE FUNCTION app.fn_award_points(p_user_id bigint, p_points integer, p_action character varying, p_resource_type character varying DEFAULT NULL::character varying, p_resource_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF p_user_id IS NULL OR p_points = 0 THEN RETURN; END IF;
  UPDATE app.users SET points = points + p_points, reputation_score = reputation_score + p_points WHERE id = p_user_id;
  INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, jsonb_build_object('points_awarded', p_points, 'timestamp', now()));
END;
$function$

```

---

## `fn_update_media_review_stats`

> Recalcula average_score y ratings_count de un media

**Argumentos:** `ninguno`  
**Retorna:** `trigger`

```sql
CREATE OR REPLACE FUNCTION app.fn_update_media_review_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_table_name TEXT;
    v_avg_score NUMERIC(4,2);
    v_ratings_count INTEGER;
BEGIN
    -- Mapear reviewable_type a nombre de tabla correcto
    v_table_name := CASE COALESCE(NEW.reviewable_type, OLD.reviewable_type)
        WHEN 'anime' THEN 'anime'
        WHEN 'manga' THEN 'manga'
        WHEN 'novel' THEN 'novels'
        WHEN 'donghua' THEN 'donghua'
        WHEN 'manhua' THEN 'manhua'
        WHEN 'manhwa' THEN 'manhwa'
        WHEN 'fan_comic' THEN 'fan_comics'
        ELSE COALESCE(NEW.reviewable_type, OLD.reviewable_type)
    END;
    
    -- Calcular nuevas mÃ©tricas
    SELECT 
        COALESCE(AVG(overall_score)::numeric(4,2), 0),
        COUNT(*)::integer
    INTO v_avg_score, v_ratings_count
    FROM app.reviews
    WHERE reviewable_type = COALESCE(NEW.reviewable_type, OLD.reviewable_type)
      AND reviewable_id = COALESCE(NEW.reviewable_id, OLD.reviewable_id)
      AND deleted_at IS NULL;
    
    -- Actualizar la tabla correspondiente
    EXECUTE format(
        'UPDATE app.%I SET average_score = $1, ratings_count = $2 WHERE id = $3',
        v_table_name
    ) USING v_avg_score, v_ratings_count, COALESCE(NEW.reviewable_id, OLD.reviewable_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$

```

---

## `fn_update_media_ranking`

> Calcula ranking_score para ordenamiento

**Argumentos:** `ninguno`  
**Retorna:** `trigger`

```sql
CREATE OR REPLACE FUNCTION app.fn_update_media_ranking()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE v_table_name TEXT; v_ranking INTEGER; v_visibility_column TEXT; BEGIN v_table_name := TG_TABLE_NAME; IF v_table_name IN ('anime', 'donghua') THEN v_visibility_column := 'is_published'; ELSE v_visibility_column := 'is_approved'; END IF; EXECUTE format($sql$SELECT COUNT(*) + 1 FROM app.%I m2 WHERE m2.deleted_at IS NULL AND m2.%I = true AND (m2.average_score * 0.7 + (m2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.%I WHERE deleted_at IS NULL), 0)) * 30) > ($1 * 0.7 + ($2::numeric / NULLIF((SELECT MAX(popularity) FROM app.%I WHERE deleted_at IS NULL), 0)) * 30) $sql$, v_table_name, v_visibility_column, v_table_name, v_table_name) INTO v_ranking USING NEW.average_score, NEW.popularity; NEW.ranking := COALESCE(v_ranking, 1); RETURN NEW; END; $function$

```

---

## `generate_slug`

> Convierte texto a slug URL-friendly

**Argumentos:** `input_title text`  
**Retorna:** `character varying`

```sql
CREATE OR REPLACE FUNCTION app.generate_slug(input_title text)
 RETURNS character varying
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
DECLARE
  result_slug VARCHAR(255);
BEGIN
  result_slug := lower(trim(input_title));
  
  -- Normalizar acentos a-z sin simbolos
  result_slug := translate(result_slug,
    'aeiounaeiounAEIOUNAEIOUN',
    'aeiounaeiounAEIOUNAEIOUN'
  );
  
  -- Quitar caracteres especiales
  result_slug := regexp_replace(result_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Normalizar espacios
  result_slug := regexp_replace(result_slug, '\s+', '-', 'g');
  result_slug := regexp_replace(result_slug, '-+', '-', 'g');
  result_slug := trim(both '-' from result_slug);
  
  IF result_slug = '' THEN
    result_slug := 'untitled';
  END IF;
  
  RETURN substring(result_slug from 1 for 255);
END;
$function$

```

---

## 📖 Resumen de Flujos

### Flujo de Contribuciones
1. Usuario envía edición → `INSERT content_contributions`
2. `trg_notify_moderators_new_contribution` → Notifica a moderadores
3. Moderador revisa y aprueba → `UPDATE status = 'approved'`
4. `trg_apply_approved_contribution` → Ejecuta `fn_apply_approved_contribution`
5. Función aplica UPDATE dinámico a tabla destino (anime, manga, etc)
6. `trg_notify_contributor_review` → Notifica al usuario

### Flujo de Rankings
1. Se modifica average_score o ratings_count
2. `trg_*_update_ranking` → Ejecuta `fn_update_media_ranking`
3. Calcula `ranking_score = average_score * LOG(ratings_count + 1)`

### Flujo de Slugs
1. Se inserta nuevo media o se actualiza título
2. `trg_set_*_slug` → Ejecuta `generate_slug`
3. Convierte título a URL-friendly (lowercase, guiones, sin caracteres especiales)

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** 26 de noviembre de 2025
