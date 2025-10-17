# Guía de Verificación - Sistema de Slugs

## ✅ Lista de Verificación Completa

### 1. Base de Datos
- [x] Función `generate_slug()` sin IDs
- [x] Funciones de ranking devuelven `slug`:
  - `calculate_daily_ranking()`
  - `calculate_weekly_ranking()`
  - `get_top_all_time()`
- [x] Slugs actualizados en todas las tablas

### 2. APIs Backend
- [x] `/api/rankings` - Devuelve slug en todas las respuestas
- [x] `/api/media` - Devuelve slug
- [x] `/api/user/profile` - Devuelve slug en listas
- [x] `/api/user/favorites` - Devuelve slug
- [x] `/api/user/lists/[listId]/items` - Devuelve slug

### 3. Componentes Frontend
- [x] `anime-page-client.tsx`:
  - Top Daily (línea 111)
  - Top Weekly (línea 133)
  - AllTime/Géneros (línea 155)
  - Próximos Estrenos (línea 203)
  - Últimos Agregados (usa slug del API)
- [x] `anime/page.tsx` - Recomendaciones sidebar
- [x] `manga/page.tsx` - Usa AnimePageClient
- [x] `novela/page.tsx` - Usa AnimePageClient
- [x] `manhua/page.tsx` - Usa AnimePageClient
- [x] `manwha/page.tsx` - Usa AnimePageClient
- [x] `fan-comic/page.tsx` - Usa AnimePageClient
- [x] `search/page.tsx` - Usa slug
- [x] `profile/page.tsx` - Usa slug del API
- [x] `user-media-list.tsx` - Usa item.slug
- [x] `related-card.tsx` - Usa item.slug
- [x] `genre-grid-card.tsx` - Usa item.slug
- [x] `recommendations-card.tsx` - Usa item.slug

## 🔍 Cómo Verificar

### Método 1: Inspeccionar HTML
1. Abre `http://localhost:9002/anime`
2. Presiona F12 (DevTools)
3. Tab "Elements"
4. Busca cualquier card de anime
5. Encuentra el elemento `<a>`
6. Verifica el atributo `href`
   - ✅ Debe ser: `href="/anime/jujutsu-kaisen"`
   - ❌ NO debe ser: `href="/anime/3"`

### Método 2: Console Log
1. Abre DevTools → Console
2. Ejecuta:
   ```javascript
   document.querySelectorAll('a[href*="/anime/"]').forEach(a => console.log(a.href))
   ```
3. Verifica que todas las URLs usan slugs

### Método 3: Network Tab
1. Abre DevTools → Network
2. Filtra por "Fetch/XHR"
3. Navega a `/anime`
4. Busca las llamadas a APIs de rankings
5. Verifica las respuestas JSON:
   ```json
   {
     "rankings": [
       {
         "id": 3,
         "slug": "jujutsu-kaisen",  // ✅ Debe existir
         "title": "Jujutsu Kaisen"
       }
     ]
   }
   ```

### Método 4: Hover sobre Links
1. Navega a `/anime` o `/manga`
2. Pasa el mouse sobre cualquier card
3. Mira la esquina inferior izquierda del navegador
4. Debe mostrar: `localhost:9002/anime/jujutsu-kaisen`

## 🐛 Solución de Problemas

### Si ves IDs en URLs:

**Problema**: Card muestra `/anime/3`

**Diagnóstico**:
1. Verifica que el API devuelve `slug`:
   ```bash
   curl http://localhost:9002/api/rankings?type=anime&period=daily&limit=1
   ```
   Debe contener `"slug": "jujutsu-kaisen"`

2. Verifica que el componente lo usa:
   - Busca en `anime-page-client.tsx`
   - Línea 111, 133, 155, 203
   - Debe ser: `slug: item.slug || item.id.toString()`

3. Limpia caché del navegador:
   - Ctrl + Shift + R (hard reload)
   - O cierra y abre el navegador

### Si manga NO funciona pero anime SÍ:

**Causa**: Manga usa el mismo componente (`AnimePageClient`)
**Solución**: Ya está corregido automáticamente

### Si el perfil muestra IDs:

**Diagnóstico**:
1. Verifica API:
   ```bash
   curl http://localhost:9002/api/user/profile
   ```
2. Debe devolver `slug` en cada item de las listas

## 📊 Estado Actual

### Archivos Modificados en Esta Sesión:
- `docs/FIX-SLUGS-REMOVE-IDS.sql`
- `docs/ADD-SLUG-TO-RANKING-FUNCTIONS.sql`
- `docs/SLUG-COMPLETE-FIX.md`
- `src/app/api/rankings/route.ts`
- `src/components/anime-page-client.tsx` (4 lugares)
- `src/components/media-page-client.tsx`
- `src/components/related-card.tsx`
- `src/app/anime/page.tsx`

### Funciones PostgreSQL Modificadas:
- `generate_slug(title, id)` - Sin agregar ID
- `calculate_daily_ranking(type, limit)` - Devuelve slug
- `calculate_weekly_ranking(type, limit)` - Devuelve slug
- `get_top_all_time(type, limit)` - Devuelve slug

### Triggers Activos:
- `anime_slug_trigger` - Genera slugs automáticamente
- `manga_slug_trigger` - Genera slugs automáticamente
- `novels_slug_trigger` - Genera slugs automáticamente

## ✅ Conclusión

Si después de reiniciar el servidor (`npm run dev`) y hacer hard reload del navegador (Ctrl+Shift+R), todavía ves IDs numéricos:

1. Verifica que las funciones de PostgreSQL se ejecutaron correctamente:
   ```sql
   SELECT * FROM app.calculate_daily_ranking('anime', 1);
   ```
   Debe devolver una columna `slug`

2. Verifica el código fue guardado:
   - `anime-page-client.tsx` líneas 111, 133, 155, 203
   - Todas deben tener: `slug: item.slug || item.id.toString()`

3. Limpia completamente el caché:
   ```bash
   # Detener servidor
   # Borrar .next
   rm -rf .next
   # Reiniciar
   npm run dev
   ```
