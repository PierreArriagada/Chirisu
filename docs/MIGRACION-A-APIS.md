# 🔄 Migración de Datos Mock a APIs

## ✅ Cambios Implementados

### Descripción
Se ha migrado el sistema de **datos de prueba (mock)** en `@/lib/db` hacia un sistema basado en **APIs RESTful** que consultan directamente la base de datos PostgreSQL.

---

## 📡 APIs Creadas

### 1. GET `/api/media`
Obtener listado de medios con paginación y ordenamiento.

**Query Parameters:**
- `type`: `anime` | `manga` | `novel` (requerido)
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 20, max: 100)
- `sort`: `created_at` | `average_score` | `title_romaji` (default: `created_at`)
- `order`: `ASC` | `DESC` (default: `DESC`)

**Ejemplo:**
```
GET /api/media?type=anime&sort=average_score&order=DESC&limit=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Shingeki no Kyojin",
      "titleNative": "進撃の巨人",
      "titleRomaji": "Shingeki no Kyojin",
      "titleEnglish": "Attack on Titan",
      "synopsis": "...",
      "imageUrl": "https://...",
      "bannerUrl": "https://...",
      "rating": 9.2,
      "ratingsCount": 15420,
      "type": "anime",
      "status": "Finalizado",
      "statusCode": "finished",
      "episodes": 75,
      "season": "Spring 2013",
      "source": "manga",
      "genres": [
        { "code": "action", "nameEs": "Acción", "nameEn": "Action" }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-10-13T08:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 450,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. GET `/api/media/[id]`
Obtener detalles completos de un medio específico.

**Query Parameters:**
- `type`: `anime` | `manga` | `novel` (requerido)

**Ejemplo:**
```
GET /api/media/123?type=anime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Shingeki no Kyojin",
    "titleNative": "進撃の巨人",
    "titleRomaji": "Shingeki no Kyojin",
    "titleEnglish": "Attack on Titan",
    "synopsis": "Hace cien años...",
    "imageUrl": "https://...",
    "bannerUrl": "https://...",
    "rating": 9.2,
    "ratingsCount": 15420,
    "type": "anime",
    "status": "Finalizado",
    "statusCode": "finished",
    "episodes": 75,
    "season": "Spring 2013",
    "source": "manga",
    "startDate": "2013-04-07",
    "endDate": "2023-11-05",
    "genres": [...],
    "externalLinks": [
      { "site": "myanimelist", "url": "https://myanimelist.net/anime/16498" },
      { "site": "anilist", "url": "https://anilist.co/anime/16498" }
    ],
    "malId": 16498,
    "anilistId": 16498,
    "kitsuId": 7442,
    "stats": {
      "totalUsers": 8520,
      "watchingCount": 320,
      "completedCount": 7850,
      "planToCount": 350
    },
    "createdBy": {
      "username": "admin",
      "displayName": "Administrador"
    },
    "isApproved": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-10-13T08:45:00Z"
  }
}
```

---

### 3. GET `/api/search`
Buscar medios por título o sinopsis.

**Query Parameters:**
- `q`: Término de búsqueda (mínimo 2 caracteres)
- `type`: `all` | `anime` | `manga` | `novel` (default: `all`)
- `limit`: Máximo de resultados (default: 20)

**Ejemplo:**
```
GET /api/search?q=attack&type=all&limit=20
```

**Response:**
```json
{
  "success": true,
  "query": "attack",
  "type": "all",
  "results": [
    {
      "id": "123",
      "title": "Shingeki no Kyojin",
      "titleNative": "進撃の巨人",
      "titleRomaji": "Shingeki no Kyojin",
      "titleEnglish": "Attack on Titan",
      "synopsis": "Hace cien años...",
      "imageUrl": "https://...",
      "rating": 9.2,
      "ratingsCount": 15420,
      "type": "anime",
      "episodes": 75,
      "season": "Spring 2013",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 5
}
```

**Características:**
- Busca en: `title_romaji`, `title_english`, `title_native`, `synopsis`
- Prioriza coincidencias exactas al inicio del título
- Ordena por relevancia y rating
- Soporta búsqueda cross-type (anime, manga, novels juntos)

---

## 🔧 Componentes Actualizados

### 1. `anime-page-client.tsx`
**Antes:**
```typescript
import { getMediaListPage, getUpcomingReleases, getLatestAdditions } from "@/lib/db";

const allItems = getMediaListPage(mediaType).topAllTime;
```

**Después:**
```typescript
// Obtiene datos desde la API
const response = await fetch(`/api/media?type=${apiType}&sort=average_score&order=DESC&limit=30`);
const data = await response.json();

const allItems: TitleInfo[] = data.data.map((item: any) => ({
  id: item.id,
  title: item.title,
  image: item.imageUrl || 'https://placehold.co/400x600?text=No+Image',
  rating: item.rating,
  category: mediaType,
}));
```

**Cambios:**
- ✅ Agregado estado de `loading`
- ✅ Función `loadMediaData()` asíncrona
- ✅ Mapeo de `MediaType` a tipo de API
- ✅ Múltiples llamadas a API (top ranked, latest additions)
- ✅ Loading spinner mientras carga

---

### 2. `search/page.tsx`
**Antes:**
```typescript
import { searchTitles, getMediaPageData } from '@/lib/db';

const initialResults: TitleInfo[] = query ? searchTitles(query) : [];
```

**Después:**
```typescript
const [loading, setLoading] = useState(false);

const searchMedia = async (searchQuery: string) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all&limit=50`);
  const data = await response.json();
  
  const results: TitleInfo[] = data.results.map((item: any) => ({
    id: item.id,
    title: item.title,
    image: item.imageUrl || 'https://placehold.co/400x600?text=No+Image',
    rating: item.rating || 0,
    type: mapTypeToMediaType(item.type),
  }));
  setInitialResults(results);
};
```

**Cambios:**
- ✅ useEffect para búsqueda automática
- ✅ Estado de loading
- ✅ Mapeo de tipos de API a MediaType
- ✅ Manejo de errores

---

## 📊 Mapeo de Tipos

### MediaType → API Type
```typescript
const typeMap: Record<MediaType, string> = {
  'Anime': 'anime',
  'Manga': 'manga',
  'Novela': 'novel',
  'Dougua': 'anime',     // Donghua son anime chinos
  'Manhua': 'manga',     // Manhua son manga chinos
  'Manwha': 'manga',     // Manhwa son manga coreanos
  'Fan Comic': 'manga',  // Fan comics como manga
};
```

---

## 🗄️ Consultas SQL Optimizadas

### Listado de Medios
```sql
SELECT 
  id, title_native, title_romaji, title_english,
  synopsis, cover_image_url, banner_image_url,
  average_score, ratings_count, status_id,
  -- Campos específicos por tipo
  created_at, updated_at
FROM app.anime  -- o manga, novels
WHERE is_published = TRUE
ORDER BY average_score DESC
LIMIT $1 OFFSET $2
```

### Búsqueda
```sql
SELECT * FROM app.anime
WHERE 
  is_published = TRUE
  AND (
    LOWER(title_romaji) LIKE $1 
    OR LOWER(title_english) LIKE $1 
    OR LOWER(title_native) LIKE $1
    OR LOWER(synopsis) LIKE $1
  )
ORDER BY 
  CASE 
    WHEN LOWER(title_romaji) LIKE $2 THEN 1  -- Prioridad a inicio
    WHEN LOWER(title_english) LIKE $2 THEN 2
    WHEN LOWER(title_native) LIKE $2 THEN 3
    ELSE 4
  END,
  average_score DESC NULLS LAST
LIMIT $3
```

### Detalles con JOINs
```sql
-- Media + Status + Creator
SELECT m.*, ms.code, ms.label_es, u.username, u.display_name
FROM app.anime m
LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
LEFT JOIN app.users u ON m.created_by = u.id
WHERE m.id = $1 AND m.is_published = TRUE

-- Géneros
SELECT g.code, g.name_es, g.name_en
FROM app.media_genres mg
JOIN app.genres g ON mg.genre_id = g.id
WHERE mg.media_type = $1 AND mg.media_id = $2

-- Enlaces externos
SELECT site, url
FROM app.external_links
WHERE media_type = $1 AND media_id = $2

-- Estadísticas de listas
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'watching') as watching_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM app.list_items
WHERE listable_type = $1 AND listable_id = $2
```

---

## 🚀 Rendimiento

### Optimizaciones Implementadas
- **Paginación**: Evita cargar todos los registros
- **Índices**: Usan los índices existentes en PostgreSQL
- **LIMIT**: Máximo 100 items por request
- **Caché**: Los componentes pueden implementar caché con SWR/React Query

### Métricas Esperadas
- Query simple: ~10-50ms
- Query con JOINs (detalles): ~50-150ms
- Búsqueda full-text: ~100-300ms (depende del volumen)

---

## ⚠️ Componentes Pendientes

Los siguientes componentes **aún usan** `@/lib/db` y necesitan migración:

### Alta Prioridad
- [ ] `media-page.tsx` - Usa `getMediaPageData()`
- [ ] `breadcrumbs.tsx` - Usa `getMediaBySlug()`, `getEpisodeById()`, etc.
- [ ] `anime/[id]/page.tsx` - Usa `getMediaPageData()`
- [ ] `manga/[id]/page.tsx` - Usa `getMediaPageData()`

### Media Prioridad
- [ ] `page.tsx` (home) - Usa `getMediaListPage()`, `getTopCharacters()`
- [ ] `novela/page.tsx` - Usa `getMediaListPage()`
- [ ] `dougua/page.tsx` - Usa `getMediaListPage()`
- [ ] Páginas de personajes y voice actors

---

## 📝 Próximos Pasos

### APIs Faltantes

1. **GET `/api/characters`** - Listado de personajes
2. **GET `/api/characters/[id]`** - Detalles de personaje
3. **GET `/api/voice-actors`** - Listado de voice actors
4. **GET `/api/voice-actors/[id]`** - Detalles de voice actor
5. **GET `/api/episodes/[id]`** - Detalles de episodio
6. **GET `/api/media/upcoming`** - Próximos estrenos (status = 'not_yet_aired')
7. **GET `/api/media/trending`** - Trending (por actividad reciente)

### Mejoras Sugeridas

1. **Implementar caché**:
   ```typescript
   import useSWR from 'swr';
   
   const { data, error } = useSWR(`/api/media?type=anime`, fetcher);
   ```

2. **Infinite scroll** para listados largos

3. **Prefetching** en navegación:
   ```typescript
   <Link href="/anime/123" prefetch>
   ```

4. **Rate limiting** en las APIs

5. **Compresión gzip** en responses grandes

---

## 🧪 Testing

### Probar las APIs

```bash
# Listado de anime
curl "http://localhost:9002/api/media?type=anime&limit=10"

# Detalles de un anime
curl "http://localhost:9002/api/media/1?type=anime"

# Búsqueda
curl "http://localhost:9002/api/search?q=attack&type=all"
```

### Probar los Componentes

1. **Página de Anime**:
   ```
   http://localhost:9002/anime
   ```
   - Debe cargar datos desde la API
   - Mostrar loading spinner inicial
   - Llenar Top Daily, Top Semanal, Géneros, Últimos Agregados

2. **Búsqueda**:
   ```
   http://localhost:9002/search?q=attack
   ```
   - Debe buscar en la API
   - Mostrar resultados filtrados
   - Permitir ordenar por rating/nuevos

---

## 💡 Notas Importantes

### Sobre @/lib/db.ts
- **NO eliminar** todavía - otros componentes lo usan
- Gradualmente migrar componentes
- Una vez completada la migración, puede eliminarse

### Validaciones
- Todas las APIs validan parámetros
- Retornan errores 400 para inputs inválidos
- Retornan errores 404 para recursos no encontrados
- Retornan errores 500 para errores de servidor

### Logs
- Todas las queries se registran en desarrollo
- Incluyen duración de ejecución
- Errores detallados en consola

---

**Última actualización**: 13 de octubre de 2025
