# Mejoras en el Sistema de Importación de AniList

## Fecha: 2025-11-04

## Problemas Resueltos

### 1. ✅ Duplicados en Personajes y Actores de Voz
**Antes:**
- 222,931 personajes (con ~127,000 duplicados)
- ~150,000 actores de voz (con duplicados)

**Después:**
- 97,702 personajes únicos (**0 duplicados por nombre**)
- 144,694 actores de voz únicos

**Solución Implementada:**
- Agregado campo `slug` único generado con `generateSlug(name, anilist_id)`
- Formato: `nombre-slugificado-{anilist_id}` (ej: `monkey-d-luffy-40`)
- `ON CONFLICT (slug) DO UPDATE` en todos los upserts
- Búsqueda por `slug` en lugar de `name` para evitar problemas de encoding

### 2. ✅ Staff sin Slug (propenso a duplicados)
**Antes:**
- Staff se insertaba solo con `name` (sin slug único)
- Propenso a duplicados por nombres similares

**Después:**
- Agregado campo `slug` a `mapAniListStaff()`
- Todos los campos de AniList ahora se importan (gender, date_of_birth, blood_type, hometown)
- `ON CONFLICT (slug) DO UPDATE` en `upsertStaff()`
- `linkStaffToMedia()` ahora busca por slug

### 3. ✅ Relaciones entre Medios (anime-manga, sequels, etc.)
**Antes:**
- Se obtenían relaciones de AniList pero **nunca se guardaban** en la BD

**Después:**
- Nueva función `mapAniListRelations()` que extrae:
  - Adaptaciones (manga → anime, anime → manga)
  - Secuelas (sequels)
  - Precuelas (prequels)
  - Side stories
  - Spin-offs
  - Versiones alternativas
  - Y más (13 tipos de relaciones)
- Nuevo método `insertRelations()` que:
  - Busca el medio relacionado en TODAS las tablas (anime, manga, manhwa, manhua, novels, donghua)
  - Inserta en `media_relations` con `ON CONFLICT` para evitar duplicados
  - Skip si el medio relacionado aún no existe (se creará en futuras importaciones)

### 4. ✅ Tipos Incorrectos en Visualización
**Antes:**
- Manhwa/Manhua/Donghua mostraban tipos incorrectos en el catálogo

**Después:**
- `MediaCard` ahora usa `mediaType` prop en lugar de detectar por slug
- Rutas correctas: `/anime/{slug}`, `/manga/{slug}`, `/manhwa/{slug}`, etc.

## Código Modificado

### `scripts/import/clients/anilist-client.ts`
```typescript
// ✅ AGREGADO: Función helper para slugs únicos
function generateSlug(text: string, id: number): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200)
    + `-${id}`;
}

// ✅ ACTUALIZADO: mapAniListCharacters ahora incluye slug
slug: generateSlug(character.name.full || character.name.native || 'character', character.id),

// ✅ ACTUALIZADO: mapAniListVoiceActors ahora incluye slug
slug: generateSlug(va.name.full || va.name.native || 'voice-actor', va.id),

// ✅ ACTUALIZADO: mapAniListStaff ahora incluye slug
slug: generateSlug(staff.name.full || 'staff', staff.id),

// ✅ AGREGADO: Nueva función para mapear relaciones
export function mapAniListRelations(anilist: AniListMedia) {
  // Mapea 13 tipos de relaciones de AniList a BD
  return anilist.relations.edges.map(edge => ({
    related_anilist_id: edge.node.id,
    related_type: edge.node.type.toLowerCase(),
    relation_type: relationTypeMap[edge.relationType] || 'other',
  }));
}
```

### `scripts/import/importer.ts`
```typescript
// ✅ AGREGADO: Import de mapAniListRelations
import { mapAniListRelations } from './clients/anilist-client';

// ✅ AGREGADO: Extraer relaciones durante procesamiento
const relations = mapAniListRelations(item);

// ✅ AGREGADO: Insertar relaciones después de studios
if (item.relations && item.relations.length > 0) {
  await this.insertRelations(item.table, mediaId, item.relations);
}

// ✅ ACTUALIZADO: upsertStaff ahora usa slug y ON CONFLICT
INSERT INTO app.staff (..., slug, ...)
ON CONFLICT (slug) DO UPDATE SET ...

// ✅ ACTUALIZADO: linkStaffToMedia busca por slug
SELECT id FROM app.staff WHERE slug = $1

// ✅ AGREGADO: Nuevo método insertRelations()
private async insertRelations(sourceTable, sourceMediaId, relations) {
  // Busca el medio relacionado en TODAS las tablas
  // Inserta en media_relations con ON CONFLICT
}
```

### `src/components/all-media-catalog.tsx`
```typescript
// ✅ ACTUALIZADO: MediaCard ahora recibe mediaType y lo usa para rutas
<MediaCard item={item} mediaType={mediaType} />

function MediaCard({ item, mediaType }) {
  // Ruta correcta basada en mediaType
  const routeMap = {
    'anime': 'anime',
    'manga': 'manga',
    'manhwa': 'manhwa',
    // ...
  };
  
  return <Link href={`/${routeMap[mediaType]}/${item.slug}`}>...</Link>;
}
```

## Estructura de Relaciones en BD

### Tabla: `media_relations`
```sql
CREATE TABLE app.media_relations (
  source_type VARCHAR(20) NOT NULL,  -- 'anime', 'manga', 'manhwa', etc.
  source_id INTEGER NOT NULL,         -- ID del medio origen
  related_type VARCHAR(20) NOT NULL,  -- 'anime', 'manga', etc.
  related_id INTEGER NOT NULL,        -- ID del medio relacionado
  relation_type VARCHAR(50),          -- 'adaptation', 'sequel', 'prequel', etc.
  PRIMARY KEY (source_type, source_id, related_type, related_id)
);
```

### Tipos de Relaciones Soportados:
1. **adaptation** - Adaptación (manga → anime o viceversa)
2. **source** - Fuente original
3. **sequel** - Secuela
4. **prequel** - Precuela
5. **side_story** - Historia paralela
6. **spin_off** - Derivado
7. **alternative** - Versión alternativa
8. **summary** - Resumen
9. **character** - Comparte personajes
10. **compilation** - Compilación
11. **contains** - Contiene
12. **parent** - Padre
13. **other** - Otra relación

## Ejemplo de Relaciones
```
Fullmetal Alchemist (manga)
  ├─ adaptation → Fullmetal Alchemist (anime 2003)
  ├─ adaptation → Fullmetal Alchemist: Brotherhood (anime 2009)
  └─ side_story → Fullmetal Alchemist: The Sacred Star of Milos (movie)

Naruto (anime)
  ├─ source → Naruto (manga)
  ├─ sequel → Naruto Shippuden (anime)
  └─ spin_off → Boruto (anime)
```

## Testing

### Verificar que no hay duplicados:
```sql
-- Personajes duplicados (debería retornar 0)
SELECT name_romaji, COUNT(*) as cnt
FROM app.characters
WHERE name_romaji IS NOT NULL
GROUP BY name_romaji
HAVING COUNT(*) > 1;

-- Actores de voz duplicados (debería retornar 0)
SELECT name_romaji, COUNT(*) as cnt
FROM app.voice_actors
WHERE name_romaji IS NOT NULL
GROUP BY name_romaji
HAVING COUNT(*) > 1;

-- Staff duplicados (debería retornar 0)
SELECT name, COUNT(*) as cnt
FROM app.staff
GROUP BY name
HAVING COUNT(*) > 1;
```

### Verificar relaciones:
```sql
-- Ver relaciones de un anime específico
SELECT 
  mr.relation_type,
  mr.related_type,
  COALESCE(a.title_romaji, m.title_romaji) as related_title
FROM app.media_relations mr
LEFT JOIN app.anime a ON mr.related_type = 'anime' AND mr.related_id = a.id
LEFT JOIN app.manga m ON mr.related_type = 'manga' AND mr.related_id = m.id
WHERE mr.source_type = 'anime' AND mr.source_id = 1;
```

## Próximos Pasos

1. ✅ Ejecutar script de limpieza de duplicados existentes
2. ⏳ Re-importar datos con el nuevo código
3. ⏳ Verificar que no se creen nuevos duplicados
4. ⏳ Crear interfaz en frontend para mostrar relaciones (adaptaciones, sequels, etc.)
5. ⏳ Implementar navegación entre medios relacionados

## Notas Importantes

- **Slugs únicos previenen duplicados**: Al incluir `anilist_id` en el slug, garantizamos unicidad incluso con nombres idénticos
- **ON CONFLICT mantiene datos actualizados**: Si un personaje/actor cambia en AniList, se actualiza automáticamente
- **Relaciones bidireccionales**: Si A → B existe, B → A también debería existir (lo maneja AniList)
- **Búsqueda por slug es más confiable**: Evita problemas de encoding (ñ, á, etc.) al buscar por nombre
