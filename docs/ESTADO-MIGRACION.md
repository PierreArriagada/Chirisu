# 🗂️ Estado de Migración del Proyecto

## Fecha: 13 de Octubre de 2025

---

## ✅ ARCHIVOS MIGRADOS (Usando APIs)

### Componentes
- ✅ `src/components/anime-page-client.tsx` - Usa `/api/media`
- ✅ `src/components/media-page-client.tsx` - Usa `/api/media/[id]` (NUEVO)

### Páginas
- ✅ `src/app/anime/[id]/page.tsx` - Usa `MediaPageClient`
- ✅ `src/app/manga/[id]/page.tsx` - Usa `MediaPageClient`
- ✅ `src/app/search/page.tsx` - Usa `/api/search`
- ✅ `src/app/profile/page.tsx` - Usa `/api/user/profile`
- ✅ `src/app/profile/edit/page.tsx` - Usa `/api/user/profile` (PATCH)

### APIs Creadas
- ✅ `src/app/api/auth/login/route.ts`
- ✅ `src/app/api/auth/logout/route.ts`
- ✅ `src/app/api/auth/session/route.ts`
- ✅ `src/app/api/user/profile/route.ts` (GET y PATCH)
- ✅ `src/app/api/media/route.ts`
- ✅ `src/app/api/media/[id]/route.ts`
- ✅ `src/app/api/search/route.ts`

---

## ⚠️ ARCHIVOS PENDIENTES DE MIGRACIÓN

### Páginas de Detalles [id]
Estas páginas AÚN usan `getMediaPageData()` de `@/lib/db`:

- ⏳ `src/app/novela/[id]/page.tsx` - **Actualizar a MediaPageClient**
- ⏳ `src/app/manhua/[id]/page.tsx` - **Actualizar a MediaPageClient**
- ⏳ `src/app/manwha/[id]/page.tsx` - **Actualizar a MediaPageClient**
- ⏳ `src/app/fan-comic/[id]/page.tsx` - **Actualizar a MediaPageClient**
- ⏳ `src/app/dougua/[id]/page.tsx` - **Actualizar a MediaPageClient**

### Páginas de Listado
Estas páginas usan `getMediaListPage()`:

- ⏳ `src/app/page.tsx` (Home) - **Necesita refactor completo**
- ⏳ `src/app/manga/page.tsx` - **Actualizar a usar anime-page-client**
- ⏳ `src/app/novela/page.tsx` - **Actualizar a usar anime-page-client**
- ⏳ `src/app/dougua/page.tsx` - **Actualizar a usar anime-page-client**
- ⏳ `src/app/manhua/page.tsx` - **Actualizar a usar anime-page-client**
- ⏳ `src/app/manwha/page.tsx` - **Actualizar a usar anime-page-client**
- ⏳ `src/app/fan-comic/page.tsx` - **Actualizar a usar anime-page-client**

### Componentes con Datos Mock
- ⏳ `src/components/media-page.tsx` - **Componente legacy (Server)**
  - Usado por páginas antiguas
  - Mantener hasta completar migración
  
- ⏳ `src/components/breadcrumbs.tsx` - **Usa múltiples funciones de db.ts**
  - `getMediaBySlug()`
  - `getEpisodeById()`
  - `getCharacterBySlug()`
  - `getVoiceActorBySlug()`
  - **Necesita API o refactor**

### Páginas Especiales
- ⏳ `src/app/episode/[id]/page.tsx` - **Usa getEpisodeById()**
  - Necesita API: `GET /api/episodes/[id]`
  
- ⏳ `src/app/character/[slug]/page.tsx` - **Usa getCharacterBySlug()**
  - Necesita API: `GET /api/characters/[slug]`
  
- ⏳ `src/app/voice-actor/[slug]/page.tsx` - **Usa getVoiceActorPageData()**
  - Necesita API: `GET /api/voice-actors/[slug]`

### Páginas del Dashboard
- ⏳ `src/app/contribution-center/*` - **Sistema completo sin implementar**
- ⏳ `src/app/dashboard/admin/*` - **Sin implementar**
- ⏳ `src/app/dashboard/moderator/*` - **Sin implementar**

---

## ❌ ARCHIVOS OBSOLETOS (Pueden Eliminarse)

### ⚠️ NO ELIMINAR TODAVÍA
Estos archivos se usarán como referencia hasta completar la migración:

- 🔶 `src/lib/db.ts` - **Mock data**
  - Contiene funciones: `getMediaPageData()`, `getMediaListPage()`, `searchTitles()`
  - Usado por 20+ componentes
  - **ELIMINAR** solo cuando todos los componentes usen APIs

### ✅ Archivos de Documentación Obsoletos
Estos pueden eliminarse o archivarse:

- ❓ `CAMBIOS-AUTH-CONTEXT.md` - Documento de cambios antiguos
- ❓ `src/app/api/test-db/route.ts` - API de prueba (si existe)

---

## 🆕 APIs NECESARIAS (Por Crear)

### Alta Prioridad
1. **GET `/api/characters`** - Listado de personajes
2. **GET `/api/characters/[id]`** - Detalles de personaje
3. **GET `/api/voice-actors`** - Listado de voice actors
4. **GET `/api/voice-actors/[id]`** - Detalles de voice actor
5. **GET `/api/episodes/[id]`** - Detalles de episodio

### Media Prioridad
6. **GET `/api/media/upcoming`** - Próximos estrenos
7. **GET `/api/media/trending`** - Medios en tendencia
8. **GET `/api/media/top`** - Top rated por tipo
9. **GET `/api/reviews`** - Reseñas de medios
10. **POST `/api/reviews`** - Crear reseña

### Baja Prioridad
11. **GET `/api/stats`** - Estadísticas generales
12. **POST `/api/user/lists`** - Crear lista personalizada
13. **PATCH `/api/user/lists/[id]`** - Actualizar lista
14. **DELETE `/api/user/lists/[id]`** - Eliminar lista
15. **POST `/api/user/lists/[id]/items`** - Agregar item a lista

---

## 📊 Progreso de Migración

### Componentes
- **Migrados**: 2 / ~25 (8%)
- **Pendientes**: ~23

### Páginas
- **Migradas**: 6 / ~40 (15%)
- **Pendientes**: ~34

### APIs
- **Creadas**: 7
- **Necesarias**: ~15
- **Progreso**: 47%

---

## 🎯 Plan de Acción

### Fase 1: Completar Páginas de Detalles (Esta Semana)
```bash
# Actualizar todas las páginas [id] a MediaPageClient
- novela/[id]/page.tsx
- manhua/[id]/page.tsx
- manwha/[id]/page.tsx
- fan-comic/[id]/page.tsx
- dougua/[id]/page.tsx
```

### Fase 2: Actualizar Páginas de Listado (Próxima Semana)
```bash
# Usar AnimePageClient con prop mediaType
- manga/page.tsx → <AnimePageClient mediaType="Manga" />
- novela/page.tsx → <AnimePageClient mediaType="Novela" />
- etc.
```

### Fase 3: Crear APIs Faltantes (2 Semanas)
```bash
# Prioridad en:
- /api/characters/[id]
- /api/voice-actors/[id]
- /api/episodes/[id]
```

### Fase 4: Refactorizar Home y Breadcrumbs (1 Mes)
```bash
# Componentes complejos
- page.tsx (home)
- breadcrumbs.tsx
```

### Fase 5: Eliminar db.ts (Cuando todo esté migrado)
```bash
# Verificar que ningún componente importe @/lib/db
# Eliminar archivo
# Actualizar documentación
```

---

## 📝 Script de Verificación

Para verificar el progreso de migración:

```bash
# Buscar imports de @/lib/db
grep -r "from '@/lib/db'" src/

# Buscar uso de getMediaPageData
grep -r "getMediaPageData" src/

# Buscar uso de getMediaListPage
grep -r "getMediaListPage" src/

# Buscar uso de searchTitles
grep -r "searchTitles" src/
```

---

## ✅ Tareas Completadas

- [x] Crear API de medios (listado)
- [x] Crear API de detalles de medio
- [x] Crear API de búsqueda
- [x] Migrar anime-page-client a API
- [x] Migrar search/page a API
- [x] Crear MediaPageClient
- [x] Migrar anime/[id]/page
- [x] Migrar manga/[id]/page

## ⏳ Tareas Pendientes

- [ ] Migrar páginas [id] restantes (novela, manhua, manwha, fan-comic, dougua)
- [ ] Migrar páginas de listado (manga, novela, etc.)
- [ ] Crear APIs de characters, voice-actors, episodes
- [ ] Migrar breadcrumbs.tsx
- [ ] Migrar home page (page.tsx)
- [ ] Eliminar db.ts cuando todo esté migrado

---

**Estado General**: 🟡 En Progreso (15% completado)
**Próxima Revisión**: 20 de Octubre de 2025
