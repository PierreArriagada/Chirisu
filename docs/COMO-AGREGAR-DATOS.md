# 📝 Guía: Cómo Agregar Datos al Sistema

## 🎯 Introducción

Este documento explica cómo agregar personajes, staff, episodios y estudios a la base de datos usando SQL directo.

---

## 👥 Agregar un Personaje

### 1. Crear el personaje
```sql
INSERT INTO app.characters (name, name_romaji, name_native, description, image_url, gender)
VALUES (
  'Satoru Gojo',
  'Satoru Gojo',
  '五条悟',
  'El hechicero más poderoso de la era moderna.',
  'https://example.com/gojo.jpg',
  'Male'
);
```

### 2. Relacionar con Anime
```sql
-- Obtener el ID del personaje recién creado
SELECT id FROM app.characters WHERE name = 'Satoru Gojo';
-- Supongamos que retorna id = 4

INSERT INTO app.characterable_characters (character_id, characterable_type, characterable_id, role)
VALUES (4, 'anime', 3, 'main');  -- 3 es el ID de Jujutsu Kaisen anime
```

### 3. Relacionar con Manga (opcional, mismo personaje)
```sql
INSERT INTO app.characterable_characters (character_id, characterable_type, characterable_id, role)
VALUES (4, 'manga', 2, 'main');  -- 2 es el ID de Jujutsu Kaisen manga
```

**Roles válidos**: `'main'` o `'supporting'`

---

## 🎬 Agregar un Staff Member

### 1. Crear el staff
```sql
INSERT INTO app.staff (name_romaji, name_native, description, image_url, date_of_birth)
VALUES (
  'Sunghoo Park',
  '박성후',
  'Director de animación surcoreano conocido por su trabajo en Jujutsu Kaisen.',
  'https://example.com/park.jpg',
  '1980-01-01'
);
```

### 2. Relacionar con Anime
```sql
-- Obtener el ID del staff
SELECT id FROM app.staff WHERE name_romaji = 'Sunghoo Park';
-- Supongamos que retorna id = 4

INSERT INTO app.staffable_staff (staff_id, staffable_type, staffable_id, role)
VALUES (4, 'anime', 3, 'Director');
```

### 3. Si trabaja en múltiples proyectos
```sql
-- Mismo staff member en otro anime
INSERT INTO app.staffable_staff (staff_id, staffable_type, staffable_id, role)
VALUES (4, 'anime', 5, 'Director');  -- Otro anime

-- Mismo staff member en manga
INSERT INTO app.staffable_staff (staff_id, staffable_type, staffable_id, role)
VALUES (4, 'manga', 2, 'Art Director');
```

**Roles comunes**:
- `'Original Creator'`
- `'Director'`
- `'Series Composition'`
- `'Character Design'`
- `'Music'`
- `'Art Director'`
- `'Sound Director'`
- `'Chief Animation Director'`
- `'Story & Art'` (para manga)

---

## 📺 Agregar un Episodio

### SQL Completo
```sql
INSERT INTO app.episodes (
  anime_id,
  episode_number,
  title,
  title_romaji,
  title_japanese,
  synopsis,
  air_date,
  duration,
  thumbnail_url,
  video_url,
  is_filler,
  is_recap
) VALUES (
  3,                              -- ID del anime
  11,                             -- Número de episodio
  'Narrow-minded',                -- Título en inglés
  'Narrow-minded',                -- Título en romaji
  '狭量',                          -- Título en japonés
  'Yuji y Nanami continúan su investigación sobre las muertes sospechosas en el cine.',
  '2020-12-12',                   -- Fecha de emisión
  24,                             -- Duración en minutos
  NULL,                           -- URL del thumbnail (opcional)
  NULL,                           -- URL del video (opcional)
  FALSE,                          -- ¿Es filler?
  FALSE                           -- ¿Es recap?
);
```

### Agregar múltiples episodios
```sql
INSERT INTO app.episodes (anime_id, episode_number, title, synopsis, air_date, duration, is_filler, is_recap)
VALUES
  (3, 11, 'Narrow-minded', 'Sinopsis...', '2020-12-12', 24, FALSE, FALSE),
  (3, 12, 'To You, Someday', 'Sinopsis...', '2020-12-19', 24, FALSE, FALSE),
  (3, 13, 'Tomorrow', 'Sinopsis...', '2020-12-26', 24, FALSE, FALSE);
```

**Campos opcionales**: `title_romaji`, `title_japanese`, `thumbnail_url`, `video_url`

---

## 🏢 Agregar un Estudio

### 1. Crear el estudio
```sql
INSERT INTO app.studios (name, description, established_date, website_url, logo_url)
VALUES (
  'Ufotable',
  'Estudio de animación japonés famoso por Demon Slayer y Fate series.',
  '2000-10-01',
  'https://www.ufotable.com',
  'https://example.com/ufotable-logo.png'
);
```

### 2. Relacionar con Anime
```sql
-- Obtener el ID del estudio
SELECT id FROM app.studios WHERE name = 'Ufotable';
-- Supongamos que retorna id = 4

-- Como estudio principal
INSERT INTO app.studiable_studios (studio_id, studiable_type, studiable_id, is_main_studio)
VALUES (4, 'anime', 5, TRUE);

-- Como estudio colaborador
INSERT INTO app.studiable_studios (studio_id, studiable_type, studiable_id, is_main_studio)
VALUES (4, 'anime', 5, FALSE);
```

---

## 🎨 Ejemplo Completo: Agregar Demon Slayer

```sql
-- 1. Crear anime (si no existe)
INSERT INTO app.anime (
  slug, title_romaji, title_english, title_native,
  synopsis, episode_count, season, year, source, status_id, is_published, is_approved
) VALUES (
  'demon-slayer',
  'Kimetsu no Yaiba',
  'Demon Slayer',
  '鬼滅の刃',
  'Un joven lucha contra demonios para salvar a su hermana.',
  26,
  'Spring',
  2019,
  'Manga',
  2,  -- Completed
  TRUE,
  TRUE
) RETURNING id;  -- Retorna id = 6

-- 2. Crear personajes
INSERT INTO app.characters (name, name_romaji, name_native, role) VALUES
  ('Tanjiro Kamado', 'Tanjiro Kamado', '竈門炭治郎', 'main'),
  ('Nezuko Kamado', 'Nezuko Kamado', '竈門禰豆子', 'main'),
  ('Zenitsu Agatsuma', 'Zenitsu Agatsuma', '我妻善逸', 'main');

-- 3. Relacionar personajes con anime
INSERT INTO app.characterable_characters (character_id, characterable_type, characterable_id, role)
VALUES
  (11, 'anime', 6, 'main'),
  (12, 'anime', 6, 'main'),
  (13, 'anime', 6, 'main');

-- 4. Crear staff
INSERT INTO app.staff (name_romaji, name_native) VALUES
  ('Koyoharu Gotouge', '吾峠呼世晴'),
  ('Haruo Sotozaki', '外崎春雄');

-- 5. Relacionar staff con anime
INSERT INTO app.staffable_staff (staff_id, staffable_type, staffable_id, role)
VALUES
  (8, 'anime', 6, 'Original Creator'),
  (9, 'anime', 6, 'Director');

-- 6. Relacionar estudio (Ufotable ya existe con id = 4)
INSERT INTO app.studiable_studios (studio_id, studiable_type, studiable_id, is_main_studio)
VALUES (4, 'anime', 6, TRUE);

-- 7. Agregar primeros 3 episodios
INSERT INTO app.episodes (anime_id, episode_number, title, air_date, duration)
VALUES
  (6, 1, 'Cruelty', '2019-04-06', 24),
  (6, 2, 'Trainer Sakonji Urokodaki', '2019-04-13', 24),
  (6, 3, 'Sabito and Makomo', '2019-04-20', 24);
```

---

## 🔍 Consultas Útiles

### Ver personajes de un anime
```sql
SELECT c.name, cc.role
FROM app.characterable_characters cc
JOIN app.characters c ON c.id = cc.character_id
WHERE cc.characterable_type = 'anime' AND cc.characterable_id = 3;
```

### Ver staff de un proyecto
```sql
SELECT s.name_romaji, ss.role
FROM app.staffable_staff ss
JOIN app.staff s ON s.id = ss.staff_id
WHERE ss.staffable_type = 'anime' AND ss.staffable_id = 3;
```

### Ver episodios de un anime
```sql
SELECT episode_number, title, air_date
FROM app.episodes
WHERE anime_id = 3
ORDER BY episode_number;
```

### Buscar un personaje en múltiples medios
```sql
SELECT 
  c.name,
  cc.characterable_type AS medio,
  CASE 
    WHEN cc.characterable_type = 'anime' THEN a.title_romaji
    WHEN cc.characterable_type = 'manga' THEN m.title_romaji
  END AS titulo
FROM app.characterable_characters cc
JOIN app.characters c ON c.id = cc.character_id
LEFT JOIN app.anime a ON a.id = cc.characterable_id AND cc.characterable_type = 'anime'
LEFT JOIN app.manga m ON m.id = cc.characterable_id AND cc.characterable_type = 'manga'
WHERE c.name = 'Yuji Itadori';
```

---

## ⚠️ Notas Importantes

### Constraints
- **UNIQUE**: `(anime_id, episode_number)` en episodes - No duplicar episodios
- **CHECK**: `role IN ('main', 'supporting')` en characterable_characters
- **FK CASCADE**: Si borras un anime, se borran sus relaciones automáticamente

### Buenas Prácticas
1. ✅ Siempre verifica IDs antes de insertar relaciones
2. ✅ Usa `RETURNING id` para obtener IDs de registros nuevos
3. ✅ Completa campos opcionales cuando tengas la información
4. ✅ Usa transacciones para inserts múltiples relacionados
5. ✅ Valida que el anime/manga existe antes de agregar relaciones

### Transacciones
```sql
BEGIN;

-- Múltiples inserts
INSERT INTO app.characters...;
INSERT INTO app.characterable_characters...;

-- Si algo falla, rollback
-- Si todo bien, commit
COMMIT;
```

---

## 🚀 Script de Inicialización Rápida

Para agregar un nuevo anime completo, copia este template:

```sql
-- ============================================
-- NUEVO ANIME: [NOMBRE DEL ANIME]
-- ============================================

BEGIN;

-- 1. ANIME
INSERT INTO app.anime (
  slug, title_romaji, title_english, synopsis, 
  episode_count, season, year, source, status_id, is_published, is_approved
) VALUES (
  'slug-del-anime',
  'Título Romaji',
  'Título en Inglés',
  'Sinopsis completa...',
  12, 'Fall', 2024, 'Manga', 1, TRUE, TRUE
) RETURNING id;  -- Anota el ID: ___

-- 2. PERSONAJES
INSERT INTO app.characters (name, name_romaji, name_native) VALUES
  ('Personaje 1', 'Romaji 1', '日本語1'),
  ('Personaje 2', 'Romaji 2', '日本語2');
  
-- Relacionar (reemplaza anime_id con el ID del paso 1)
INSERT INTO app.characterable_characters (character_id, characterable_type, characterable_id, role)
VALUES
  (LAST_INSERT_ID, 'anime', [ANIME_ID], 'main'),
  (LAST_INSERT_ID + 1, 'anime', [ANIME_ID], 'supporting');

-- 3. STAFF
INSERT INTO app.staff (name_romaji) VALUES ('Director Name');

INSERT INTO app.staffable_staff (staff_id, staffable_type, staffable_id, role)
VALUES (LAST_INSERT_ID, 'anime', [ANIME_ID], 'Director');

-- 4. ESTUDIO (si ya existe, usa su ID)
INSERT INTO app.studiable_studios (studio_id, studiable_type, studiable_id, is_main_studio)
VALUES ([STUDIO_ID], 'anime', [ANIME_ID], TRUE);

-- 5. EPISODIOS
INSERT INTO app.episodes (anime_id, episode_number, title, air_date, duration)
VALUES
  ([ANIME_ID], 1, 'Episode 1', '2024-10-01', 24),
  ([ANIME_ID], 2, 'Episode 2', '2024-10-08', 24);

COMMIT;
```

---

**Última actualización**: 2025-01-17
