# PLAN DE IMPLEMENTACIÓN - PÁGINA /ANIME COMPLETA
## Fecha: 13 de Octubre, 2025

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla la implementación completa de la página `/anime` y sus componentes asociados, incluyendo:
- Sistema de rankings dinámicos (diario, semanal, mensual, histórico)
- Grid de géneros interactivo
- Sistema de favoritos (personajes principales, secundarios, actores de voz)
- Sistema de tracking de trailers con conteo de visualizaciones
- Últimos agregados y próximos estrenos

---

## 🎯 OBJETIVOS

1. **Rankings Dinámicos**: Implementar cálculo automático de tops basados en ratings, favoritos y actividad
2. **Favoritos Multi-nivel**: Permitir favoritos de personajes (main/supporting) y actores de voz
3. **Trailers Tracking**: Sistema de conteo de vistas para identificar trailers más populares
4. **Géneros Interactivos**: Grid que muestra contenido filtrado por género
5. **Sidebar Informativo**: Recomendaciones, top personajes, últimos posts

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Tabla de Favoritos de Usuarios

\`\`\`sql
-- Tabla polimórfica para favoritos
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorable_type VARCHAR(20) NOT NULL, -- 'character', 'voice_actor', 'anime', 'manga', 'novel'
    favorable_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, favorable_type, favorable_id)
);

COMMENT ON TABLE user_favorites IS 'Favoritos polimórficos: personajes, actores de voz, medios';
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_polymorphic ON user_favorites(favorable_type, favorable_id);
\`\`\`

### 2. Ampliar Tabla de Personajes

\`\`\`sql
-- Agregar campos a characters
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS name_romaji VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_native VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_characters_favorites ON characters(favorites_count DESC);
\`\`\`

### 3. Tabla de Actores de Voz

\`\`\`sql
-- Crear tabla de actores de voz
CREATE TABLE IF NOT EXISTS voice_actors (
    id SERIAL PRIMARY KEY,
    name_romaji VARCHAR(255),
    name_native VARCHAR(255),
    image_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'ja', -- 'ja', 'es', 'en', etc.
    bio TEXT,
    favorites_count INTEGER DEFAULT 0,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE voice_actors IS 'Actores de voz (seiyuu y dobladores)';
CREATE INDEX idx_voice_actors_favorites ON voice_actors(favorites_count DESC);
CREATE INDEX idx_voice_actors_language ON voice_actors(language);

-- Relación characters <-> voice_actors
CREATE TABLE IF NOT EXISTS character_voice_actors (
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    voice_actor_id INTEGER REFERENCES voice_actors(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
    media_id INTEGER NOT NULL,
    PRIMARY KEY (character_id, voice_actor_id, media_type, media_id)
);

COMMENT ON TABLE character_voice_actors IS 'Qué actor de voz interpreta a qué personaje en qué medio';
\`\`\`

### 4. Tabla de Trailers

\`\`\`sql
-- Tabla para trailers de medios
CREATE TABLE IF NOT EXISTS media_trailers (
    id BIGSERIAL PRIMARY KEY,
    mediable_type VARCHAR(20) NOT NULL,
    mediable_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL, -- YouTube, Vimeo, etc.
    thumbnail_url VARCHAR(500),
    views_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE media_trailers IS 'Trailers de anime/manga/novels con tracking de vistas';
CREATE INDEX idx_trailers_polymorphic ON media_trailers(mediable_type, mediable_id);
CREATE INDEX idx_trailers_views ON media_trailers(views_count DESC);

-- Tabla para tracking de vistas individuales (evitar bots)
CREATE TABLE IF NOT EXISTS trailer_views (
    id BIGSERIAL PRIMARY KEY,
    trailer_id BIGINT REFERENCES media_trailers(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL si no autenticado
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) -- Para usuarios no autenticados
);

COMMENT ON TABLE trailer_views IS 'Tracking de vistas de trailers con deduplicación';
CREATE INDEX idx_trailer_views_trailer ON trailer_views(trailer_id);
CREATE INDEX idx_trailer_views_session ON trailer_views(session_id, trailer_id);
\`\`\`

### 5. Tabla de Rankings Precalculados (Caché)

\`\`\`sql
-- Tabla para cachear rankings calculados
CREATE TABLE IF NOT EXISTS rankings_cache (
    id SERIAL PRIMARY KEY,
    ranking_type VARCHAR(50) NOT NULL, -- 'top_daily', 'top_weekly', 'top_monthly', 'top_all_time'
    media_type VARCHAR(20) NOT NULL, -- 'anime', 'manga', 'novel'
    media_id BIGINT NOT NULL,
    rank_position INTEGER NOT NULL,
    score NUMERIC(10,2),
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (ranking_type, media_type, rank_position)
);

COMMENT ON TABLE rankings_cache IS 'Rankings precalculados para optimizar performance';
CREATE INDEX idx_rankings_cache_lookup ON rankings_cache(ranking_type, media_type, expires_at);
\`\`\`

---

## 🔧 FUNCIONES AUXILIARES EN BASE DE DATOS

### 1. Función para Calcular Top Diario

\`\`\`sql
CREATE OR REPLACE FUNCTION app.calculate_daily_ranking(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    daily_score NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_activity AS (
        SELECT 
            li.listable_id as media_id,
            COUNT(*) * 10 as activity_points -- 10 puntos por cada add
        FROM app.list_items li
        WHERE li.listable_type = p_media_type
          AND li.created_at >= CURRENT_DATE
        GROUP BY li.listable_id
    ),
    daily_ratings AS (
        SELECT
            r.reviewable_id as media_id,
            AVG(r.overall_score) * 5 as rating_points -- 5 puntos por rating promedio
        FROM app.reviews r
        WHERE r.reviewable_type = p_media_type
          AND r.created_at >= CURRENT_DATE
        GROUP BY r.reviewable_id
    )
    SELECT 
        m.id::BIGINT as media_id,
        COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
        m.cover_image_url::VARCHAR(800),
        m.average_score,
        (COALESCE(da.activity_points, 0) + COALESCE(dr.rating_points, 0) + (m.average_score * 2))::NUMERIC(10,2) as daily_score
    FROM app.anime m
    LEFT JOIN daily_activity da ON m.id = da.media_id
    LEFT JOIN daily_ratings dr ON m.id = dr.media_id
    WHERE m.is_published = TRUE 
      AND m.deleted_at IS NULL
    ORDER BY daily_score DESC, m.average_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 2. Función para Top Semanal

\`\`\`sql
CREATE OR REPLACE FUNCTION app.calculate_weekly_ranking(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    weekly_score NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_activity AS (
        SELECT 
            li.listable_id as media_id,
            COUNT(*) * 5 as activity_points
        FROM app.list_items li
        WHERE li.listable_type = p_media_type
          AND li.created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY li.listable_id
    ),
    weekly_ratings AS (
        SELECT
            r.reviewable_id as media_id,
            AVG(r.overall_score) * 3 as rating_points,
            COUNT(*) as reviews_count
        FROM app.reviews r
        WHERE r.reviewable_type = p_media_type
          AND r.created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY r.reviewable_id
    )
    SELECT 
        m.id::BIGINT as media_id,
        COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
        m.cover_image_url::VARCHAR(800),
        m.average_score,
        (COALESCE(wa.activity_points, 0) + COALESCE(wr.rating_points, 0) + (m.average_score * 3))::NUMERIC(10,2) as weekly_score
    FROM app.anime m
    LEFT JOIN weekly_activity wa ON m.id = wa.media_id
    LEFT JOIN weekly_ratings wr ON m.id = wr.media_id
    WHERE m.is_published = TRUE 
      AND m.deleted_at IS NULL
    ORDER BY weekly_score DESC, m.average_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 3. Función para Top de Todos los Tiempos

\`\`\`sql
CREATE OR REPLACE FUNCTION app.get_top_all_time(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    ratings_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id::BIGINT as media_id,
        COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
        m.cover_image_url::VARCHAR(800),
        m.average_score,
        m.ratings_count::INTEGER
    FROM app.anime m
    WHERE m.is_published = TRUE 
      AND m.deleted_at IS NULL
      AND m.average_score > 0
      AND m.ratings_count >= 10 -- Mínimo 10 ratings para entrar al top
    ORDER BY m.average_score DESC, m.ratings_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 4. Función para Top Personajes

\`\`\`sql
CREATE OR REPLACE FUNCTION app.get_top_characters(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    character_id INTEGER,
    character_name VARCHAR(255),
    character_image VARCHAR(500),
    character_slug VARCHAR(255),
    favorites_count INTEGER,
    appearances_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH character_appearances AS (
        SELECT 
            cc.character_id,
            COUNT(DISTINCT (cc.characterable_type, cc.characterable_id)) as appearances
        FROM app.characterable_characters cc
        GROUP BY cc.character_id
    )
    SELECT 
        c.id as character_id,
        COALESCE(c.name_romaji, c.name, c.name_native)::VARCHAR(255) as character_name,
        c.image_url::VARCHAR(500) as character_image,
        c.slug::VARCHAR(255) as character_slug,
        c.favorites_count::INTEGER,
        COALESCE(ca.appearances, 0) as appearances_count
    FROM app.characters c
    LEFT JOIN character_appearances ca ON c.id = ca.character_id
    WHERE c.favorites_count > 0
    ORDER BY c.favorites_count DESC, ca.appearances DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 5. Función para Top Trailers

\`\`\`sql
CREATE OR REPLACE FUNCTION app.get_top_trailers_daily(p_limit INTEGER DEFAULT 6)
RETURNS TABLE (
    trailer_id BIGINT,
    title VARCHAR(255),
    thumbnail_url VARCHAR(500),
    url TEXT,
    views_count INTEGER,
    media_title VARCHAR(255),
    media_id BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_views AS (
        SELECT 
            tv.trailer_id,
            COUNT(*) as daily_views
        FROM app.trailer_views tv
        WHERE tv.viewed_at >= CURRENT_DATE
        GROUP BY tv.trailer_id
    )
    SELECT 
        mt.id as trailer_id,
        mt.title::VARCHAR(255),
        mt.thumbnail_url::VARCHAR(500),
        mt.url,
        COALESCE(dv.daily_views, 0)::INTEGER as views_count,
        COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as media_title,
        mt.mediable_id as media_id
    FROM app.media_trailers mt
    LEFT JOIN daily_views dv ON mt.id = dv.trailer_id
    LEFT JOIN app.anime m ON mt.mediable_type = 'anime' AND mt.mediable_id = m.id
    ORDER BY views_count DESC, mt.views_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## 📡 NUEVAS API ROUTES

### 1. `/api/rankings` - Rankings Dinámicos

**Archivo:** `src/app/api/rankings/route.ts`

\`\`\`typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'anime'; // anime, manga, novel
    const period = searchParams.get('period') || 'weekly'; // daily, weekly, monthly, all_time
    const limit = parseInt(searchParams.get('limit') || '20');

    let functionName = '';
    switch (period) {
      case 'daily':
        functionName = 'calculate_daily_ranking';
        break;
      case 'weekly':
        functionName = 'calculate_weekly_ranking';
        break;
      case 'all_time':
        functionName = 'get_top_all_time';
        break;
      default:
        functionName = 'calculate_weekly_ranking';
    }

    const query = \`SELECT * FROM app.\${functionName}($1, $2)\`;
    const result = await db.query(query, [type, limit]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: {
        type,
        period,
        limit,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/rankings:', error);
    return NextResponse.json(
      { error: 'Error al obtener rankings' },
      { status: 500 }
    );
  }
}
\`\`\`

### 2. `/api/characters` - Top Personajes

**Archivo:** `src/app/api/characters/route.ts`

\`\`\`typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const top = searchParams.get('top') === 'true';

    if (top) {
      // Top personajes más populares
      const result = await db.query(\`SELECT * FROM app.get_top_characters($1)\`, [limit]);
      
      return NextResponse.json({
        success: true,
        data: result.rows,
      });
    }

    // Listado normal de personajes
    const result = await db.query(\`
      SELECT 
        c.id,
        c.name,
        c.name_romaji,
        c.name_native,
        c.image_url,
        c.slug,
        c.favorites_count
      FROM app.characters c
      ORDER BY c.favorites_count DESC
      LIMIT $1
    \`, [limit]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error en GET /api/characters:', error);
    return NextResponse.json(
      { error: 'Error al obtener personajes' },
      { status: 500 }
    );
  }
}
\`\`\`

### 3. `/api/trailers` - Trailers Populares

**Archivo:** `src/app/api/trailers/route.ts`

\`\`\`typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const period = searchParams.get('period') || 'daily'; // daily, weekly, all_time

    const result = await db.query(\`SELECT * FROM app.get_top_trailers_\${period}($1)\`, [limit]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: {
        period,
        limit,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/trailers:', error);
    return NextResponse.json(
      { error: 'Error al obtener trailers' },
      { status: 500 }
    );
  }
}

// POST - Registrar vista de trailer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trailerId, userId, sessionId, ipAddress, userAgent } = body;

    if (!trailerId) {
      return NextResponse.json({ error: 'trailerId requerido' }, { status: 400 });
    }

    // Evitar duplicados: verificar si ya vio este trailer en esta sesión/usuario
    const checkQuery = userId
      ? \`SELECT id FROM app.trailer_views WHERE trailer_id = $1 AND user_id = $2 AND viewed_at > NOW() - INTERVAL '1 day'\`
      : \`SELECT id FROM app.trailer_views WHERE trailer_id = $1 AND session_id = $2 AND viewed_at > NOW() - INTERVAL '1 day'\`;
    
    const checkParams = userId ? [trailerId, userId] : [trailerId, sessionId];
    const existingView = await db.query(checkQuery, checkParams);

    if (existingView.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Vista ya registrada',
      });
    }

    // Registrar nueva vista
    await db.query(\`
      INSERT INTO app.trailer_views (trailer_id, user_id, session_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    \`, [trailerId, userId || null, sessionId, ipAddress, userAgent]);

    // Incrementar contador en trailer
    await db.query(\`
      UPDATE app.media_trailers 
      SET views_count = views_count + 1
      WHERE id = $1
    \`, [trailerId]);

    return NextResponse.json({
      success: true,
      message: 'Vista registrada',
    });
  } catch (error) {
    console.error('❌ Error en POST /api/trailers:', error);
    return NextResponse.json(
      { error: 'Error al registrar vista' },
      { status: 500 }
    );
  }
}
\`\`\`

### 4. `/api/favorites` - Sistema de Favoritos

**Archivo:** `src/app/api/favorites/route.ts`

\`\`\`typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Obtener favoritos del usuario
export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'character', 'voice_actor', 'anime', etc.

    let query = \`
      SELECT 
        uf.*,
        CASE 
          WHEN uf.favorable_type = 'character' THEN (SELECT name FROM app.characters WHERE id = uf.favorable_id)
          WHEN uf.favorable_type = 'voice_actor' THEN (SELECT name_romaji FROM app.voice_actors WHERE id = uf.favorable_id)
        END as name
      FROM app.user_favorites uf
      WHERE uf.user_id = $1
    \`;

    const params = [decoded.userId];

    if (type) {
      query += \` AND uf.favorable_type = $2\`;
      params.push(type);
    }

    query += \` ORDER BY uf.created_at DESC\`;

    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error en GET /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

// POST - Agregar a favoritos
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const body = await request.json();
    const { favorableType, favorableId } = body;

    if (!favorableType || !favorableId) {
      return NextResponse.json(
        { error: 'favorableType y favorableId requeridos' },
        { status: 400 }
      );
    }

    // Insertar favorito
    await db.query(\`
      INSERT INTO app.user_favorites (user_id, favorable_type, favorable_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, favorable_type, favorable_id) DO NOTHING
    \`, [decoded.userId, favorableType, favorableId]);

    // Incrementar contador en la entidad favoriteada
    const tableName = favorableType === 'voice_actor' ? 'voice_actors' : \`\${favorableType}s\`;
    await db.query(\`
      UPDATE app.\${tableName}
      SET favorites_count = favorites_count + 1
      WHERE id = $1
    \`, [favorableId]);

    return NextResponse.json({
      success: true,
      message: 'Agregado a favoritos',
    });
  } catch (error) {
    console.error('❌ Error en POST /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al agregar favorito' },
      { status: 500 }
    );
  }
}

// DELETE - Remover de favoritos
export async function DELETE(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { searchParams } = new URL(request.url);
    const favorableType = searchParams.get('type');
    const favorableId = searchParams.get('id');

    if (!favorableType || !favorableId) {
      return NextResponse.json(
        { error: 'type y id requeridos' },
        { status: 400 }
      );
    }

    // Eliminar favorito
    const result = await db.query(\`
      DELETE FROM app.user_favorites
      WHERE user_id = $1 AND favorable_type = $2 AND favorable_id = $3
      RETURNING id
    \`, [decoded.userId, favorableType, parseInt(favorableId)]);

    if (result.rows.length > 0) {
      // Decrementar contador
      const tableName = favorableType === 'voice_actor' ? 'voice_actors' : \`\${favorableType}s\`;
      await db.query(\`
        UPDATE app.\${tableName}
        SET favorites_count = GREATEST(0, favorites_count - 1)
        WHERE id = $1
      \`, [favorableId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Removido de favoritos',
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al remover favorito' },
      { status: 500 }
    );
  }
}
\`\`\`

---

## 🎨 ACTUALIZACIÓN DE COMPONENTES

### Resumen de Cambios Necesarios

1. **AnimePageClient** → Llamar a `/api/rankings` para tops
2. **TopCharactersCard** → Llamar a `/api/characters?top=true`
3. **TrailersSection** (nuevo) → Llamar a `/api/trailers`
4. **GenreGridCard** → Filtrar por género usando `/api/media?type=anime&genre=action`
5. **RecommendationsCard** → Obtener recomendaciones basadas en favoritos del usuario

---

## 🗓️ TRABAJOS PROGRAMADOS (CRON JOBS)

### 1. Job Diario - Actualizar Rankings

**Frecuencia:** Cada día a las 00:00 UTC

\`\`\`typescript
// src/jobs/update-rankings.ts
import { db } from '@/lib/database';

export async function updateDailyRankings() {
  const mediaTypes = ['anime', 'manga', 'novel'];
  
  for (const mediaType of mediaTypes) {
    // Calcular y cachear rankings
    const dailyResult = await db.query(\`SELECT * FROM app.calculate_daily_ranking($1, 20)\`, [mediaType]);
    const weeklyResult = await db.query(\`SELECT * FROM app.calculate_weekly_ranking($1, 50)\`, [mediaType]);
    
    // Limpiar cache viejo
    await db.query(\`
      DELETE FROM app.rankings_cache 
      WHERE media_type = $1 AND expires_at < NOW()
    \`, [mediaType]);
    
    // Insertar nuevos rankings
    for (let i = 0; i < dailyResult.rows.length; i++) {
      const row = dailyResult.rows[i];
      await db.query(\`
        INSERT INTO app.rankings_cache (ranking_type, media_type, media_id, rank_position, score, expires_at)
        VALUES ('top_daily', $1, $2, $3, $4, NOW() + INTERVAL '1 day')
        ON CONFLICT (ranking_type, media_type, rank_position) 
        DO UPDATE SET media_id = $2, score = $4, calculated_at = NOW(), expires_at = NOW() + INTERVAL '1 day'
      \`, [mediaType, row.media_id, i + 1, row.daily_score]);
    }
    
    for (let i = 0; i < weeklyResult.rows.length; i++) {
      const row = weeklyResult.rows[i];
      await db.query(\`
        INSERT INTO app.rankings_cache (ranking_type, media_type, media_id, rank_position, score, expires_at)
        VALUES ('top_weekly', $1, $2, $3, $4, NOW() + INTERVAL '1 day')
        ON CONFLICT (ranking_type, media_type, rank_position) 
        DO UPDATE SET media_id = $2, score = $4, calculated_at = NOW(), expires_at = NOW() + INTERVAL '1 day'
      \`, [mediaType, row.media_id, i + 1, row.weekly_score]);
    }
  }
  
  console.log('✅ Rankings actualizados');
}
\`\`\`

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [ ] Crear tabla \`user_favorites\`
- [ ] Ampliar tabla \`characters\` con campos adicionales
- [ ] Crear tabla \`voice_actors\`
- [ ] Crear tabla \`character_voice_actors\`
- [ ] Crear tabla \`media_trailers\`
- [ ] Crear tabla \`trailer_views\`
- [ ] Crear tabla \`rankings_cache\`
- [ ] Crear función \`calculate_daily_ranking()\`
- [ ] Crear función \`calculate_weekly_ranking()\`
- [ ] Crear función \`get_top_all_time()\`
- [ ] Crear función \`get_top_characters()\`
- [ ] Crear función \`get_top_trailers_daily()\`

### API Routes
- [ ] Crear \`/api/rankings/route.ts\`
- [ ] Crear \`/api/characters/route.ts\`
- [ ] Crear \`/api/trailers/route.ts\`
- [ ] Crear \`/api/favorites/route.ts\`
- [ ] Ampliar \`/api/media/route.ts\` para filtrar por género

### Componentes
- [ ] Actualizar \`AnimePageClient\` para usar nuevas APIs
- [ ] Actualizar \`TopCharactersCard\` para usar \`/api/characters\`
- [ ] Crear \`TrailersCard\` componente
- [ ] Actualizar \`GenreGridCard\` para filtrar correctamente
- [ ] Crear hook \`useFavorites\` para manejo de favoritos
- [ ] Agregar botones de favoritos en cards de personajes

### Cron Jobs
- [ ] Configurar job diario para actualizar rankings
- [ ] Configurar job semanal para limpiar vistas de trailers antiguas

---

## 📊 MÉTRICAS Y MONITOREO

### KPIs a Trackear
1. **Engagement de Rankings**: Clicks en items del top diario vs semanal
2. **Popularidad de Géneros**: Qué géneros se exploran más
3. **Vistas de Trailers**: Cuáles son los trailers más vistos cada día
4. **Favoritos Trending**: Qué personajes/VA están ganando favoritos más rápido
5. **Performance de Cache**: Hit rate de rankings_cache

---

## 🚀 PRÓXIMOS PASOS

1. Ejecutar scripts SQL de creación de tablas
2. Implementar APIs de rankings, characters, trailers y favorites
3. Actualizar componentes para consumir nuevas APIs
4. Configurar cron jobs
5. Poblar datos de prueba (personajes, actores de voz, trailers)
6. Testing end-to-end
7. Deploy a producción con monitoreo

---

**Última actualización:** 13 de Octubre, 2025
**Autor:** GitHub Copilot
**Estado:** Pendiente de aprobación para implementación
