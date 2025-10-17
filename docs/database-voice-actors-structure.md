# Estructura de Relaciones: Personajes y Actores de Voz

## 📊 Diagrama de Relaciones

```
┌─────────────────┐
│   anime/manga   │
│    /novels      │
│   (media_id)    │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────┐         ┌──────────────────────┐
│ characterable_      │         │  staffable_staff     │
│   characters        │         │                      │
│                     │         │  - staff_id          │
│  - character_id     │         │  - staffable_type    │
│  - characterable... │         │  - staffable_id      │
│  - role (main/supp) │         │  - role              │
└──────────┬──────────┘         └──────────────────────┘
           │
           ▼
    ┌─────────────┐
    │ characters  │
    │             │
    │ - id        │
    │ - name      │
    │ - name_rom..│
    │ - slug      │
    │ - descript..│
    │ - age       │
    │ - gender    │
    │ - blood_... │
    └──────┬──────┘
           │
           │ many-to-many via character_voice_actors
           │
           ▼
    ┌────────────────────────────┐
    │ character_voice_actors     │◄─── TABLA INTERMEDIA CLAVE
    │                            │
    │ - character_id             │
    │ - voice_actor_id           │
    │ - media_type  (anime/manga/novel) ◄── Indica de qué medio viene
    │ - media_id                 │          el doblaje
    └──────────┬─────────────────┘
               │
               ▼
        ┌──────────────┐
        │ voice_actors │
        │              │
        │ - id         │
        │ - name_romaji│
        │ - language   │ ◄── 'ja' (japonés) o 'es' (español)
        │ - slug       │
        │ - bio        │
        │ - hometown   │
        │ - gender     │
        └──────────────┘
```

## 🎯 Casos de Uso

### 1. **Mismo personaje, diferentes actores según el medio**
```sql
-- Ejemplo: Yuji Itadori puede tener:
-- - Actor japonés A en el anime
-- - Actor japonés B en el manga (si tiene audio drama)
-- - Actor japonés C en el videojuego

INSERT INTO character_voice_actors 
  (character_id, voice_actor_id, media_type, media_id)
VALUES
  (1, 11, 'anime', 3),  -- Yuji en anime Jujutsu Kaisen
  (1, 25, 'game', 8);   -- Yuji en juego Jujutsu Kaisen
```

### 2. **Mostrar actores de voz de un personaje en un anime específico**
```sql
SELECT 
  c.name,
  va.name_romaji as actor_name,
  va.language,
  cva.media_type
FROM characters c
JOIN character_voice_actors cva ON cva.character_id = c.id
JOIN voice_actors va ON va.id = cva.voice_actor_id
WHERE c.id = 1 
  AND cva.media_type = 'anime' 
  AND cva.media_id = 3;
```

### 3. **Obtener todos los personajes de un anime con sus actores**
```sql
-- Esta es la query que usa la API actual
SELECT 
  c.id,
  c.name,
  c.slug,
  MAX(CASE WHEN va.language = 'ja' THEN va.name_romaji END) as japanese_actor,
  MAX(CASE WHEN va.language = 'es' THEN va.name_romaji END) as spanish_actor
FROM characterable_characters cc
JOIN characters c ON c.id = cc.character_id
LEFT JOIN character_voice_actors cva 
  ON cva.character_id = c.id 
  AND cva.media_type = 'anime' 
  AND cva.media_id = 3
LEFT JOIN voice_actors va ON va.id = cva.voice_actor_id
WHERE cc.characterable_type = 'anime' 
  AND cc.characterable_id = 3
GROUP BY c.id, c.name, c.slug;
```

## 🔧 Ventajas de esta Estructura

### ✅ **Flexibilidad**
- Un personaje puede tener múltiples actores de voz
- Diferentes actores para diferentes medios (anime vs manga vs novel)
- Diferentes actores para diferentes idiomas

### ✅ **Trazabilidad**
- Siempre sabes de qué medio viene el doblaje
- `media_type` + `media_id` identifican el origen exacto

### ✅ **Escalabilidad**
- Agregar nuevos idiomas es trivial (solo cambiar `language`)
- Agregar nuevos medios no requiere cambios en la estructura

### ✅ **Consistencia**
- Foreign keys previenen datos huérfanos
- ON DELETE CASCADE limpia automáticamente relaciones rotas

## 📝 Valores de Idiomas

```typescript
// En TypeScript
type VoiceActorLanguage = 'ja' | 'es' | 'en' | 'fr' | 'de';

// En SQL
language IN ('ja', 'es', 'en', 'fr', 'de')
```

**Códigos usados:**
- `ja` - Japonés (Japanese)
- `es` - Español (Spanish)
- `en` - Inglés (English)
- `fr` - Francés (French)
- `de` - Alemán (German)

## 🚫 Anti-patrones a Evitar

### ❌ **NO hagas esto:**
```sql
-- NO: Vincular directamente character -> voice_actor sin media_type/media_id
CREATE TABLE character_voice_actors (
  character_id INT,
  voice_actor_id INT
  -- Falta contexto de medio!
);
```

### ✅ **SÍ haz esto:**
```sql
-- SÍ: Siempre incluye media_type y media_id
CREATE TABLE character_voice_actors (
  character_id INT,
  voice_actor_id INT,
  media_type VARCHAR(20) NOT NULL,  -- ¡Esencial!
  media_id INT NOT NULL              -- ¡Esencial!
);
```

## 🔍 Queries de Debug Útiles

### Ver todas las relaciones de un personaje
```sql
SELECT 
  c.name as character,
  va.name_romaji as actor,
  va.language,
  cva.media_type,
  CASE cva.media_type
    WHEN 'anime' THEN (SELECT title_romaji FROM anime WHERE id = cva.media_id)
    WHEN 'manga' THEN (SELECT title_romaji FROM manga WHERE id = cva.media_id)
    WHEN 'novel' THEN (SELECT title_romaji FROM novels WHERE id = cva.media_id)
  END as media_title
FROM character_voice_actors cva
JOIN characters c ON c.id = cva.character_id
JOIN voice_actors va ON va.id = cva.voice_actor_id
WHERE c.id = 1;
```

### Encontrar personajes sin actores de voz
```sql
SELECT c.id, c.name
FROM characters c
LEFT JOIN character_voice_actors cva ON cva.character_id = c.id
WHERE cva.character_id IS NULL;
```

### Ver actores más prolíficos
```sql
SELECT 
  va.name_romaji,
  va.language,
  COUNT(DISTINCT cva.character_id) as character_count,
  COUNT(DISTINCT cva.media_id) as media_count
FROM voice_actors va
JOIN character_voice_actors cva ON cva.voice_actor_id = va.id
GROUP BY va.id, va.name_romaji, va.language
ORDER BY character_count DESC;
```

## 📚 Futuros Desarrollos

### 1. **Agregar más idiomas**
```sql
-- Fácil: solo agregar nuevos voice_actors con language diferente
INSERT INTO voice_actors (name_romaji, language, ...) 
VALUES ('John Doe', 'en', ...);
```

### 2. **Soportar múltiples actores por idioma**
```sql
-- Ya soportado! Solo agregar más filas con mismo character_id + language
INSERT INTO character_voice_actors VALUES (1, 11, 'anime', 3); -- Actor 1 (ja)
INSERT INTO character_voice_actors VALUES (1, 26, 'anime', 3); -- Actor 2 (ja)
```

### 3. **Agregar roles de actor**
```sql
-- Extender la tabla intermedia
ALTER TABLE character_voice_actors 
ADD COLUMN role VARCHAR(50); -- 'main', 'young', 'old', 'alternate'
```

## 🎬 Ejemplo Real: Jujutsu Kaisen

```
Anime: Jujutsu Kaisen (id=3)
│
├─ Yuji Itadori (character_id=1)
│  ├─ 🇯🇵 Yuuma Uchida (ja)
│  └─ 🇪🇸 Enrique Cervantes (es)
│
├─ Satoru Gojo (character_id=4)
│  ├─ 🇯🇵 Yuichi Nakamura (ja)
│  └─ 🇪🇸 José Gilberto Vilchis (es)
│
└─ Megumi Fushiguro (character_id=2)
   ├─ 🇯🇵 Megumi Ogata (ja)
   └─ 🇪🇸 Irwin Dayayan (es)

Manga: Jujutsu Kaisen (id=2)
│
└─ (Los mismos personajes pueden tener DIFERENTES actores aquí)
```

---

**Última actualización:** 2025-10-17  
**Desarrollador:** Sistema Chirisu  
**Estado:** ✅ Implementado y funcionando
