# Modelo de Base de Datos - Chirisu

## Índice
1. [Diagrama Entidad-Relación](#diagrama-entidad-relación)
2. [Tablas de Usuarios](#tablas-de-usuarios)
3. [Tablas de Medios](#tablas-de-medios)
4. [Tablas de Personajes y Personal](#tablas-de-personajes-y-personal)
5. [Tablas de Interacción](#tablas-de-interacción)
6. [Tablas de Contenido Generado](#tablas-de-contenido-generado)
7. [Tablas de Configuración](#tablas-de-configuración)
8. [Triggers y Funciones](#triggers-y-funciones)

---

## Diagrama Entidad-Relación

### Entidades Principales

```
┌─────────────┐
│   USERS     │──────┐
└─────────────┘      │
       │             │
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────────┐
│ USER_LISTS  │  │ USER_ROLES   │
└─────────────┘  └──────────────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ LIST_ITEMS  │  │    ROLES     │
└─────────────┘  └──────────────┘
       │
       │ (polimórfico)
       │
       ├──► ANIME
       ├──► MANGA
       ├──► NOVELS
       ├──► DONGHUA
       ├──► MANHUA
       ├──► MANHWA
       └──► FAN_COMICS
```

---

## Tablas de Usuarios

### users
Tabla central de usuarios del sistema.

```sql
CREATE TABLE app.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  contributions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  gender VARCHAR(20),
  date_of_birth DATE,
  location VARCHAR(100),
  website_url TEXT,
  twitter_handle VARCHAR(50),
  discord_tag VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_username ON app.users(username);
CREATE INDEX idx_users_email ON app.users(email);
CREATE INDEX idx_users_level ON app.users(level DESC);
CREATE INDEX idx_users_points ON app.users(points DESC);
```

**Campos Clave:**
- `level`: Calculado automáticamente basado en puntos
- `points`: Acumulado por acciones del usuario
- `contributions_count`: Solo contribuciones aprobadas
- `deleted_at`: Soft delete

### roles
Definición de roles del sistema.

```sql
CREATE TABLE app.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'moderator', 'user'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO app.roles (name, description) VALUES
('admin', 'Administrador con acceso completo'),
('moderator', 'Moderador con permisos de moderación'),
('user', 'Usuario regular');
```

### user_roles
Relación muchos a muchos entre usuarios y roles.

```sql
CREATE TABLE app.user_roles (
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES app.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON app.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON app.user_roles(role_id);
```

---

## Tablas de Medios

### anime
Información de series anime y donghua.

```sql
CREATE TABLE app.anime (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_romaji VARCHAR(255),
  title_native VARCHAR(255),
  title_english VARCHAR(255),
  image_url TEXT,
  banner_url TEXT,
  synopsis TEXT,
  type VARCHAR(50), -- 'anime' o 'donghua'
  format VARCHAR(50), -- 'TV', 'Movie', 'OVA', 'ONA', 'Special'
  episodes INTEGER,
  duration_minutes INTEGER,
  status VARCHAR(50), -- 'Airing', 'Finished', 'Upcoming', 'Cancelled'
  season VARCHAR(20), -- 'Winter', 'Spring', 'Summer', 'Fall'
  year INTEGER,
  source VARCHAR(50), -- 'Manga', 'Light Novel', 'Original', etc.
  rating VARCHAR(10), -- 'G', 'PG', 'PG-13', 'R', 'R+', 'Rx'
  ranking INTEGER,
  popularity INTEGER,
  trailer_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_anime_slug ON app.anime(slug);
CREATE INDEX idx_anime_ranking ON app.anime(ranking);
CREATE INDEX idx_anime_year ON app.anime(year);
CREATE INDEX idx_anime_status ON app.anime(status);
```

### manga / manhua / manhwa / fan_comics
Información de publicaciones impresas/digitales.

```sql
CREATE TABLE app.manga (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_romaji VARCHAR(255),
  title_native VARCHAR(255),
  title_english VARCHAR(255),
  image_url TEXT,
  banner_url TEXT,
  synopsis TEXT,
  type VARCHAR(50), -- 'manga', 'manhua', 'manhwa', 'fan_comic'
  serialization VARCHAR(50), -- 'Manga', 'Manhwa', 'One-shot', 'Doujinshi'
  chapters INTEGER,
  volumes INTEGER,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  rating VARCHAR(10),
  ranking INTEGER,
  popularity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Índices similares a anime
```

### novels
Información de novelas ligeras y web novels.

```sql
CREATE TABLE app.novels (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_romaji VARCHAR(255),
  title_native VARCHAR(255),
  title_english VARCHAR(255),
  image_url TEXT,
  banner_url TEXT,
  synopsis TEXT,
  type VARCHAR(50), -- 'Light Novel', 'Web Novel', 'Novel'
  chapters INTEGER,
  volumes INTEGER,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  rating VARCHAR(10),
  ranking INTEGER,
  popularity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### genres
Géneros aplicables a todos los medios.

```sql
CREATE TABLE app.genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50), -- 'genre' o 'theme'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de relación polimórfica
CREATE TABLE app.genreable_genres (
  genre_id INTEGER REFERENCES app.genres(id),
  genreable_type VARCHAR(50) NOT NULL, -- 'anime', 'manga', etc.
  genreable_id INTEGER NOT NULL,
  PRIMARY KEY (genre_id, genreable_type, genreable_id)
);

CREATE INDEX idx_genreable_type_id ON app.genreable_genres(genreable_type, genreable_id);
```

---

## Tablas de Personajes y Personal

### characters
Personajes de anime, manga, etc.

```sql
CREATE TABLE app.characters (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_romaji VARCHAR(255),
  name_native VARCHAR(255),
  image_url TEXT,
  description TEXT,
  favorites_count INTEGER DEFAULT 0,
  gender VARCHAR(20),
  age VARCHAR(50),
  blood_type VARCHAR(5),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_slug ON app.characters(slug);
CREATE INDEX idx_characters_favorites ON app.characters(favorites_count DESC);
```

### voice_actors
Actores de voz (seiyuus).

```sql
CREATE TABLE app.voice_actors (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_romaji VARCHAR(255) NOT NULL,
  name_native VARCHAR(255),
  image_url TEXT,
  language VARCHAR(50), -- 'Japanese', 'Spanish', etc.
  bio TEXT,
  favorites_count INTEGER DEFAULT 0,
  gender VARCHAR(20),
  date_of_birth DATE,
  blood_type VARCHAR(5),
  hometown VARCHAR(100),
  website_url TEXT,
  twitter_handle VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_voice_actors_slug ON app.voice_actors(slug);
CREATE INDEX idx_voice_actors_language ON app.voice_actors(language);
```

### staff
Personal de producción (directores, escritores, etc.).

```sql
CREATE TABLE app.staff (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_romaji VARCHAR(255),
  name_native VARCHAR(255),
  image_url TEXT,
  bio TEXT,
  primary_occupations TEXT[], -- ['Director', 'Writer']
  favorites_count INTEGER DEFAULT 0,
  gender VARCHAR(20),
  date_of_birth DATE,
  hometown VARCHAR(100),
  years_active VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_staff_slug ON app.staff(slug);
```

### Tablas de Relación

```sql
-- Personajes en medios
CREATE TABLE app.characterable_characters (
  character_id INTEGER REFERENCES app.characters(id),
  characterable_type VARCHAR(50) NOT NULL,
  characterable_id INTEGER NOT NULL,
  role VARCHAR(50), -- 'Main', 'Supporting', 'Background'
  PRIMARY KEY (character_id, characterable_type, characterable_id)
);

-- Voice actors de personajes
CREATE TABLE app.character_voice_actors (
  character_id INTEGER REFERENCES app.characters(id),
  voice_actor_id INTEGER REFERENCES app.voice_actors(id),
  characterable_type VARCHAR(50) NOT NULL,
  characterable_id INTEGER NOT NULL,
  PRIMARY KEY (character_id, voice_actor_id, characterable_type, characterable_id)
);

-- Staff en medios
CREATE TABLE app.staffable_staff (
  staff_id INTEGER REFERENCES app.staff(id),
  staffable_type VARCHAR(50) NOT NULL,
  staffable_id INTEGER NOT NULL,
  role VARCHAR(100), -- 'Director', 'Original Creator', etc.
  PRIMARY KEY (staff_id, staffable_type, staffable_id, role)
);
```

---

## Tablas de Interacción

### user_lists
Listas de usuarios (predeterminadas y personalizadas).

```sql
CREATE TABLE app.user_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'anime', 'manga', 'novel', etc.
  category VARCHAR(50), -- 'watching', 'completed', 'custom', etc.
  is_custom BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(user_id, name, type)
);

CREATE INDEX idx_user_lists_user ON app.user_lists(user_id);
CREATE INDEX idx_user_lists_type ON app.user_lists(type);
```

### list_items
Items dentro de las listas (polimórfico).

```sql
CREATE TABLE app.list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES app.user_lists(id) ON DELETE CASCADE,
  listable_type VARCHAR(50) NOT NULL, -- 'anime', 'manga', etc.
  listable_id INTEGER NOT NULL,
  status VARCHAR(50), -- 'watching', 'completed', etc.
  score INTEGER CHECK (score >= 1 AND score <= 10),
  progress INTEGER DEFAULT 0, -- Episodios/capítulos vistos
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  times_rewatched INTEGER DEFAULT 0,
  priority VARCHAR(20), -- 'low', 'medium', 'high'
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(list_id, listable_type, listable_id)
);

CREATE INDEX idx_list_items_list ON app.list_items(list_id);
CREATE INDEX idx_list_items_type_id ON app.list_items(listable_type, listable_id);
```

### user_favorites
Favoritos de usuarios (polimórfico).

```sql
CREATE TABLE app.user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  favorable_type VARCHAR(50) NOT NULL, -- 'anime', 'character', etc.
  favorable_id INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(user_id, favorable_type, favorable_id)
);

CREATE INDEX idx_user_favorites_user ON app.user_favorites(user_id);
CREATE INDEX idx_user_favorites_type_id ON app.user_favorites(favorable_type, favorable_id);
```

---

## Tablas de Contenido Generado

### comments
Sistema de comentarios anidados (polimórfico).

```sql
CREATE TABLE app.comments (
  id SERIAL PRIMARY KEY,
  commentable_type VARCHAR(50) NOT NULL, -- 'anime', 'character', etc.
  commentable_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES app.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  images TEXT[], -- Array de URLs
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_commentable ON app.comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_user ON app.comments(user_id);
CREATE INDEX idx_comments_parent ON app.comments(parent_id);
CREATE INDEX idx_comments_created ON app.comments(created_at DESC);
```

### comment_reactions
Likes en comentarios.

```sql
CREATE TABLE app.comment_reactions (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES app.comments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) DEFAULT 'like', -- Extensible a otros tipos
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX idx_comment_reactions_comment ON app.comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON app.comment_reactions(user_id);
```

### reviews
Reseñas de medios (polimórfico).

```sql
CREATE TABLE app.reviews (
  id SERIAL PRIMARY KEY,
  reviewable_type VARCHAR(50) NOT NULL,
  reviewable_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 1 AND overall_score <= 10),
  story_score INTEGER CHECK (story_score >= 1 AND story_score <= 10),
  character_score INTEGER CHECK (character_score >= 1 AND character_score <= 10),
  art_score INTEGER CHECK (art_score >= 1 AND art_score <= 10),
  sound_score INTEGER CHECK (sound_score >= 1 AND sound_score <= 10),
  content TEXT NOT NULL,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(reviewable_type, reviewable_id, user_id)
);

CREATE INDEX idx_reviews_reviewable ON app.reviews(reviewable_type, reviewable_id);
CREATE INDEX idx_reviews_user ON app.reviews(user_id);
CREATE INDEX idx_reviews_score ON app.reviews(overall_score DESC);
```

### user_contributions
Contribuciones pendientes/aprobadas/rechazadas.

```sql
CREATE TABLE app.user_contributions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  contribution_type VARCHAR(50) NOT NULL, -- 'anime', 'character', etc.
  contribution_data JSONB NOT NULL, -- Datos de la entidad a crear
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by INTEGER REFERENCES app.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_contributions_user ON app.user_contributions(user_id);
CREATE INDEX idx_contributions_status ON app.user_contributions(status);
CREATE INDEX idx_contributions_type ON app.user_contributions(contribution_type);
```

### content_reports
Reportes de contenido inapropiado.

```sql
CREATE TABLE app.content_reports (
  id SERIAL PRIMARY KEY,
  reportable_type VARCHAR(50) NOT NULL, -- 'comment', 'review'
  reportable_id INTEGER NOT NULL,
  reported_by INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  resolved_by INTEGER REFERENCES app.users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_reports_reportable ON app.content_reports(reportable_type, reportable_id);
CREATE INDEX idx_content_reports_status ON app.content_reports(status);
```

### notifications
Sistema de notificaciones.

```sql
CREATE TABLE app.notifications (
  id SERIAL PRIMARY KEY,
  recipient_user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'comment_reply', 'contribution_approved', etc.
  notifiable_type VARCHAR(50), -- Tipo de entidad relacionada
  notifiable_id INTEGER, -- ID de entidad relacionada
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON app.notifications(recipient_user_id, is_read);
CREATE INDEX idx_notifications_created ON app.notifications(created_at DESC);
```

---

## Tablas de Configuración

### action_points
Puntos otorgados por diferentes acciones.

```sql
CREATE TABLE app.action_points (
  action VARCHAR(50) PRIMARY KEY,
  points INTEGER NOT NULL,
  description TEXT
);

-- Configuración inicial
INSERT INTO app.action_points (action, points, description) VALUES
('comment_on_media', 1, 'Comentar en un medio'),
('add_to_list', 1, 'Agregar medio a lista'),
('write_review', 3, 'Escribir una reseña'),
('approve_contribution', 5, 'Contribución aprobada por moderador');
```

---

## Triggers y Funciones

### fn_calculate_level()
Calcula el nivel basado en puntos.

```sql
CREATE OR REPLACE FUNCTION fn_calculate_level(p_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(SQRT(p_points / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### fn_award_points()
Otorga puntos y actualiza nivel.

```sql
CREATE OR REPLACE FUNCTION fn_award_points(
  p_user_id INTEGER,
  p_points INTEGER,
  p_action_name VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  new_level INTEGER;
BEGIN
  -- Actualizar puntos y contribuciones
  UPDATE app.users 
  SET points = points + p_points,
      contributions_count = CASE 
        WHEN p_action_name = 'approve_contribution' 
        THEN contributions_count + 1 
        ELSE contributions_count 
      END
  WHERE id = p_user_id;

  -- Calcular y actualizar nivel
  SELECT fn_calculate_level(points) INTO new_level
  FROM app.users WHERE id = p_user_id;

  UPDATE app.users 
  SET level = new_level
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### Triggers de Comentarios

```sql
-- Trigger para otorgar puntos al comentar
CREATE OR REPLACE FUNCTION app.trg_comment_insert()
RETURNS TRIGGER AS $$
DECLARE
  pts INTEGER := 0;
BEGIN
  -- Solo otorgar puntos si es comentario principal (no respuesta)
  IF NEW.parent_id IS NULL THEN
    SELECT points INTO pts FROM app.action_points WHERE action = 'comment_on_media';
    IF pts IS NULL THEN pts := 0; END IF;
    
    PERFORM fn_award_points(NEW.user_id, pts, 'comment_on_media', NEW.commentable_type, NEW.commentable_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_insert
AFTER INSERT ON app.comments
FOR EACH ROW
EXECUTE FUNCTION app.trg_comment_insert();

-- Trigger para actualizar contador de respuestas
CREATE OR REPLACE FUNCTION app.trg_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE app.comments 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE app.comments 
    SET replies_count = replies_count - 1 
    WHERE id = OLD.parent_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_reply_count
AFTER INSERT OR DELETE ON app.comments
FOR EACH ROW
EXECUTE FUNCTION app.trg_comment_reply_count();
```

### Triggers de Likes

```sql
-- Trigger para actualizar contador de likes
CREATE OR REPLACE FUNCTION app.trg_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE app.comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE app.comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_likes_count
AFTER INSERT OR DELETE ON app.comment_reactions
FOR EACH ROW
EXECUTE FUNCTION app.trg_comment_likes_count();
```

### Triggers de Favoritos

```sql
-- Trigger para actualizar contador de favoritos
CREATE OR REPLACE FUNCTION app.trg_update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    EXECUTE format(
      'UPDATE app.%I SET favorites_count = favorites_count + 1 WHERE id = $1',
      NEW.favorable_type
    ) USING NEW.favorable_id;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format(
      'UPDATE app.%I SET favorites_count = favorites_count - 1 WHERE id = $1',
      OLD.favorable_type
    ) USING OLD.favorable_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_favorites_count
AFTER INSERT OR DELETE ON app.user_favorites
FOR EACH ROW
EXECUTE FUNCTION app.trg_update_favorites_count();
```

---

## Relaciones Polimórficas

### Patrón Utilizado

Muchas tablas usan relaciones polimórficas para reutilizar estructuras:

```sql
-- Ejemplo: Comentarios pueden ser en cualquier entidad
commentable_type VARCHAR(50)  -- 'anime', 'character', 'staff', etc.
commentable_id INTEGER        -- ID de la entidad específica
```

### Entidades que Soportan Polimorfismo

| Tabla | Campo Type | Entidades Soportadas |
|-------|-----------|---------------------|
| `comments` | `commentable_type` | anime, manga, novels, donghua, manhua, manhwa, fan_comic, character, voice_actor, staff |
| `list_items` | `listable_type` | anime, manga, novels, donghua, manhua, manhwa, fan_comic |
| `user_favorites` | `favorable_type` | anime, manga, novels, donghua, manhua, manhwa, fan_comic, character, voice_actor, staff |
| `reviews` | `reviewable_type` | anime, manga, novels, donghua, manhua, manhwa, fan_comic |
| `genreable_genres` | `genreable_type` | anime, manga, novels, donghua, manhua, manhwa, fan_comic |

---

Esta documentación proporciona una vista completa del modelo de datos de Chirisu, incluyendo todas las tablas, relaciones, y lógica de negocio implementada en triggers y funciones.
