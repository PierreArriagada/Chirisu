# 📊 ESQUEMA DE BASE DE DATOS - BD_CHIRISU

**Fecha:** 2025-01-11  
**Schema:** `app`

---

## 🔴 TABLAS DE REPORTES

### `comment_reports`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval('comment_reports_id_seq') |
| comment_id | integer | NO | |
| reporter_user_id | integer | NO | |
| reported_user_id | integer | NO | |
| reason | varchar(100) | NO | |
| comments | text | YES | |
| status | varchar(50) | NO | 'pending' |
| assigned_to | integer | YES | |
| assigned_at | timestamp | YES | |
| created_at | timestamp | YES | now() |
| resolved_at | timestamp | YES | |
| resolved_by | integer | YES | |
| resolution_notes | text | YES | |
| action_taken | varchar(50) | YES | |

**Status válidos:** 'pending', 'reviewing', 'resolved', 'rejected'  
**Reason válidos:** 'spam', 'offensive_language', 'harassment', 'spoilers', 'irrelevant_content', 'misinformation', 'other'  
**Action válidos:** 'no_action', 'warning_sent', 'comment_deleted', 'user_warned', 'user_suspended'

---

### `review_reports`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval('review_reports_id_seq') |
| review_id | integer | NO | |
| reporter_user_id | integer | NO | |
| reported_user_id | integer | NO | |
| reason | varchar(100) | NO | |
| comments | text | YES | |
| status | varchar(50) | NO | 'pending' |
| created_at | timestamp | YES | now() |
| resolved_at | timestamp | YES | |
| resolved_by | integer | YES | |
| resolution_notes | text | YES | |
| action_taken | varchar(50) | YES | |
| assigned_to | integer | YES | |
| assigned_at | timestamp | YES | |

**Status válidos:** 'pending', 'reviewing', 'resolved', 'rejected'

---

### `user_reports`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval('user_reports_id_seq') |
| reported_user_id | integer | NO | |
| reporter_user_id | integer | NO | |
| reason | varchar(100) | NO | |
| description | text | NO | |
| status | varchar(50) | NO | 'pending' |
| assigned_to | integer | YES | |
| assigned_at | timestamp | YES | |
| created_at | timestamp | YES | now() |
| resolved_at | timestamp | YES | |
| resolved_by | integer | YES | |
| resolution_notes | text | YES | |
| action_taken | varchar(50) | YES | |

**Status válidos:** 'pending', 'reviewing', 'resolved', 'rejected'

---

### `content_reports`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | bigint | NO | nextval('content_reports_id_seq') |
| reportable_type | varchar(20) | NO | |
| reportable_id | bigint | NO | |
| reported_by | bigint | NO | |
| report_reason | text | NO | |
| status | varchar(20) | YES | 'pending' |
| reviewed_by | bigint | YES | |
| moderator_notes | text | YES | |
| created_at | timestamp with time zone | YES | now() |
| resolved_at | timestamp with time zone | YES | |
| assigned_to | bigint | YES | |
| assigned_at | timestamp with time zone | YES | |

**Tipos reportables:** 'anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'

---

## 👤 TABLAS DE USUARIOS

### `users`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | bigint | NO | nextval('users_id_seq') |
| uuid | uuid | NO | |
| email | varchar(320) | NO | |
| password_hash | varchar(255) | NO | |
| username | varchar(80) | NO | |
| display_name | varchar(120) | YES | |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| date_of_birth | date | YES | |
| nationality_code | char(2) | YES | |
| nationality_name | varchar(100) | YES | |
| nationality_flag_url | varchar(500) | YES | |
| bio | varchar(200) | YES | |
| avatar_url | varchar(500) | YES | |
| banner_url | varchar(500) | YES | |
| points | bigint | NO | 0 |
| reputation_score | bigint | NO | 0 |
| level | integer | NO | 1 |
| contributions_count | integer | NO | 0 |
| saves_count | integer | NO | 0 |
| followers_count | integer | NO | 0 |
| following_count | integer | NO | 0 |
| is_active | boolean | YES | true |
| locale | varchar(10) | YES | 'es' |
| deleted_at | timestamp with time zone | YES | |
| email_verification_token | varchar(255) | YES | |
| email_verification_expires | timestamp | YES | |
| has_2fa_setup | boolean | YES | false |
| tracking_id | varchar(12) | NO | |

---

### `roles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval('roles_id_seq') |
| name | varchar(50) | NO | |
| display_name | varchar(100) | NO | |
| description | text | YES | |
| created_at | timestamp with time zone | YES | now() |

**Roles comunes:** 'admin', 'moderator', 'user'

---

### `user_roles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| user_id | integer | YES | |
| role_id | integer | YES | |
| assigned_by | integer | YES | |
| assigned_at | timestamp with time zone | YES | now() |

---

## 💬 TABLAS DE CONTENIDO

### `comments`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | bigint | NO | nextval('comments_id_seq') |
| commentable_type | varchar(20) | NO | |
| commentable_id | bigint | NO | |
| user_id | bigint | YES | |
| parent_id | bigint | YES | |
| content | text | NO | |
| is_spoiler | boolean | YES | false |
| likes_count | integer | YES | 0 |
| replies_count | integer | YES | 0 |
| created_at | timestamp with time zone | YES | now() |
| updated_at | timestamp with time zone | YES | now() |
| deleted_at | timestamp with time zone | YES | |
| images | jsonb | YES | |

**Tipos comentables:** 'anime', 'manga', 'novels', etc.

---

### `reviews`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | bigint | NO | nextval('reviews_id_seq') |
| user_id | bigint | NO | |
| reviewable_type | varchar(20) | NO | |
| reviewable_id | bigint | NO | |
| content | text | NO | |
| overall_score | integer | YES | |
| helpful_votes | integer | YES | 0 |
| created_at | timestamp with time zone | YES | now() |
| updated_at | timestamp with time zone | YES | now() |
| deleted_at | timestamp with time zone | YES | |

---

## 🔔 TABLA DE NOTIFICACIONES

### `notifications`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | bigint | NO | nextval('notifications_id_seq') |
| recipient_user_id | bigint | NO | |
| actor_user_id | bigint | YES | |
| action_type | varchar(50) | NO | |
| notifiable_type | varchar(20) | NO | |
| notifiable_id | bigint | NO | |
| read_at | timestamp with time zone | YES | |
| created_at | timestamp with time zone | YES | now() |

**Action types para reportes:**
- `'comment_reported'` → Reporte de comentario (notifiable_type: 'comment_report')
- `'review_reported'` → Reporte de reseña (notifiable_type: 'review_report')
- `'user_reported'` → Reporte de usuario (notifiable_type: 'user_report')
- `'content_report'` → Reporte de contenido (notifiable_type: 'content_report')

---

## 📝 NOTAS IMPORTANTES

### Sistema de Asignación de Reportes
Todas las tablas de reportes tienen:
- `assigned_to` (INTEGER): ID del moderador asignado
- `assigned_at` (TIMESTAMP): Cuándo se asignó

### Regla de Visibilidad (15 días)
```sql
WHERE (
  isAdmin = true                                    -- Admins ven todo
  OR assigned_to IS NULL                            -- Casos sin asignar
  OR assigned_to = currentUserId                    -- Tus casos
  OR (assigned_at < NOW() - INTERVAL '15 days'     -- Casos abandonados
      AND status != 'resolved')
)
```

### Triggers Activos
- `trg_notify_new_comment_report` → Notifica cuando se crea un reporte de comentario
- `trg_notify_new_review_report` → Notifica cuando se crea un reporte de reseña
- `trg_notify_new_user_report` → Notifica cuando se crea un reporte de usuario
- `trg_notify_new_report` → Notifica cuando se crea un reporte de contenido

---

**Última actualización:** 2025-01-11
