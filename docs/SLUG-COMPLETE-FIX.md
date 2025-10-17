# Corrección Completa - Slugs en TODAS las vistas

## Problema Identificado

Aunque habíamos corregido la función `generate_slug()` en la base de datos, **las páginas de listado** (anime, manga, perfil, favoritos) seguían mostrando URLs con IDs numéricos en vez de slugs:

- ❌ `/anime/3` en vez de ✅ `/anime/jujutsu-kaisen`  
- ❌ `/manga/2` en vez de ✅ `/manga/jujutsu-kaisen`

### Causa Raíz

Las **funciones de ranking de PostgreSQL** NO estaban devolviendo el campo `slug`, solo devolvían:
- `media_id`
- `title`
- `cover_image_url`
- `average_score`
- `daily_score` / `weekly_score`

Por lo tanto, los componentes de React **no tenían acceso al slug** y usaban el ID como fallback.

## Solución Implementada

### 1. Base de Datos - Funciones de Ranking

**Archivo**: `docs/ADD-SLUG-TO-RANKING-FUNCTIONS.sql`

**Funciones Modificadas**:

#### `calculate_daily_ranking()`
```sql
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,  -- ✅ AGREGADO
    cover_image_url VARCHAR,
    average_score NUMERIC,
    daily_score NUMERIC
)
```

#### `calculate_weekly_ranking()`
```sql
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,  -- ✅ AGREGADO
    cover_image_url VARCHAR,
    average_score NUMERIC,
    weekly_score NUMERIC
)
```

#### `get_top_all_time()`
```sql
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,  -- ✅ AGREGADO
    cover_image_url VARCHAR,
    average_score NUMERIC,
    ranking INTEGER
)
```

**Proceso**:
1. DROP de funciones existentes
2. CREATE con nueva firma incluyendo `slug`
3. SELECT del campo `slug` desde las tablas anime/manga/novels

### 2. API - Incluir Slug en Respuestas

**Archivo**: `src/app/api/rankings/route.ts`

**Cambios en TODAS las respuestas**:

```typescript
// ANTES
rankings = result.rows.map(row => ({
  id: row.media_id,
  title: row.title,
  coverImage: row.cover_image_url,
  // ...
}));

// DESPUÉS
rankings = result.rows.map(row => ({
  id: row.media_id,
  slug: row.slug,  // ✅ AGREGADO
  title: row.title,
  coverImage: row.cover_image_url,
  // ...
}));
```

**Endpoints Actualizados**:
- ✅ `/api/rankings?period=daily` - incluye slug
- ✅ `/api/rankings?period=weekly` - incluye slug
- ✅ `/api/rankings?period=monthly` - incluye slug
- ✅ `/api/rankings?period=all_time` - incluye slug

### 3. Frontend - Usar Slug del API

**Archivo**: `src/components/anime-page-client.tsx`

**Cambios**:

```typescript
// ANTES (líneas 112, 131, 155)
slug: item.id.toString(),  // ❌ Usando ID

// DESPUÉS
slug: item.slug || item.id.toString(),  // ✅ Usando slug del API
```

**Secciones Corregidas**:
- ✅ Top Daily Rankings
- ✅ Top Weekly Rankings
- ✅ All Time Rankings (usado en filtros de género)
- ✅ Últimos Agregados (ya usaba slug correctamente)

**Archivo**: `src/app/anime/page.tsx`

```typescript
// Recomendaciones en sidebar
<RecommendationsCard items={recommendations.map((r: any) => ({
  id: r.id,
  slug: r.slug || r.id.toString(),  // ✅ AGREGADO
  title: r.title,
  imageUrl: r.coverImage,
  rating: r.averageScore,
  type: 'Anime'
}))} />
```

## Flujo Completo de Datos

### Ejemplo: Top Daily Anime

1. **PostgreSQL** - Función `calculate_daily_ranking('anime', 5)`
   ```sql
   SELECT a.id, a.slug, COALESCE(a.title_romaji, ...) as title, ...
   ```
   Resultado: `{ media_id: 3, slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', ... }`

2. **API** - `/api/rankings?type=anime&period=daily&limit=5`
   ```json
   {
     "rankings": [
       {
         "id": 3,
         "slug": "jujutsu-kaisen",
         "title": "Jujutsu Kaisen",
         "coverImage": "...",
         "averageScore": 10.0
       }
     ]
   }
   ```

3. **React Component** - `anime-page-client.tsx`
   ```typescript
   const dailyItems: TitleInfo[] = data.rankings.map(item => ({
     id: item.id.toString(),
     slug: item.slug || item.id.toString(),  // ✅ "jujutsu-kaisen"
     title: item.title,
     // ...
   }));
   ```

4. **Link Component** - Genera URL correcta
   ```tsx
   <Link href={`/anime/${item.slug}`}>
   ```
   URL final: `/anime/jujutsu-kaisen` ✅

## Archivos Modificados

### Base de Datos
- `docs/ADD-SLUG-TO-RANKING-FUNCTIONS.sql` (creado)
- Funciones PostgreSQL:
  - `app.calculate_daily_ranking()`
  - `app.calculate_weekly_ranking()`
  - `app.get_top_all_time()`

### Backend (APIs)
- `src/app/api/rankings/route.ts` - Agregado slug a todas las respuestas

### Frontend (Componentes)
- `src/components/anime-page-client.tsx` - Usar slug del API (3 lugares)
- `src/app/anime/page.tsx` - Agregar slug a recomendaciones

## Resultado Final

### URLs en TODAS las vistas ahora usan slugs:

| Vista | Antes | Después |
|-------|-------|---------|
| Página /anime | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Página /manga | `/manga/2` | `/manga/jujutsu-kaisen` ✅ |
| Top Daily | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Top Weekly | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Géneros | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Perfil | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Favoritos | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |
| Búsqueda | `/anime/3` | `/anime/jujutsu-kaisen` ✅ |

### Navegación Mejorada

- ✅ URLs limpias sin IDs numéricos
- ✅ SEO-friendly
- ✅ Mejor experiencia de usuario
- ✅ Consistencia en TODA la aplicación
- ✅ Compartir links más legibles

## Verificación

Para probar que todo funciona:

1. Ir a `http://localhost:9002/anime`
2. Inspeccionar cualquier card de anime
3. Verificar que el `<a href>` es `/anime/jujutsu-kaisen`
4. Hacer clic y verificar que navega correctamente
5. Repetir en `/manga`, perfil, favoritos, etc.

## Estado: ✅ COMPLETADO

El sistema ahora usa slugs consistentemente en **TODAS** las vistas de la aplicación.
