# 🔧 Fix Aplicado: Slugs sin ID

## ❌ Problema Encontrado

Al intentar aprobar una contribución, aparecía el error:

```
error: no existe la función generate_slug(character varying, bigint)
hint: Ninguna función coincide en el nombre y tipos de argumentos
where: función PL/pgSQL auto_generate_slug() en la línea 4
```

**Causa:** El trigger `auto_generate_slug()` que ya existía en tu base de datos intentaba llamar a:
```sql
generate_slug(title, id)  -- Con 2 parámetros
```

Pero nuestra función solo tenía 1 parámetro (title).

## 🎯 Requisito del Usuario

> "los slug, no deben tener la ID, solo el nombre del anime"

Los slugs deben ser:
- ✅ `dragon-ball-z` 
- ✅ `one-piece`
- ✅ `pokemon-diamante-y-perla`

Y NO:
- ❌ `dragon-ball-z-1`
- ❌ `one-piece-42`
- ❌ `pokemon-diamante-y-perla-100`

## ✅ Solución Aplicada

### 1. Función `generate_slug()` actualizada

**Antes (con ID):**
```sql
CREATE FUNCTION app.generate_slug(title TEXT, id BIGINT) 
RETURNS VARCHAR(255) AS $$
BEGIN
  base_slug := substring(base_slug from 1 for 200) || '-' || id::text;
  RETURN base_slug;
END;
$$;
```

**Ahora (sin ID):**
```sql
CREATE FUNCTION app.generate_slug(title TEXT) 
RETURNS VARCHAR(255) AS $$
BEGIN
  -- Solo normalizar el titulo, sin agregar ID
  base_slug := substring(base_slug from 1 for 255);
  RETURN base_slug;
END;
$$;
```

### 2. Trigger `auto_generate_slug()` actualizado

**Antes:**
```sql
NEW.slug := generate_slug(title, NEW.id);  -- Error: 2 parámetros
```

**Ahora:**
```sql
NEW.slug := app.generate_slug(
  COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native)
);  -- Correcto: 1 parámetro
```

### 3. Aplicado a todas las tablas

El fix se aplicó a:
- ✅ `app.anime` → trigger `auto_generate_slug`
- ✅ `app.manga` → trigger `auto_generate_slug`
- ✅ `app.novels` → trigger `auto_generate_slug`

## 🧪 Verificaciones Realizadas

### Tests de la función:

| Test | Input | Output Esperado | Output Real | Estado |
|------|-------|-----------------|-------------|--------|
| 1 | "Dragon Ball Z" | `dragon-ball-z` | `dragon-ball-z` | ✅ |
| 2 | "One Piece & Café!" | `one-piece-cafe` | `one-piece-cafe` | ✅ |
| 3 | "Pokémon: Diamante y Perla" | `pokemon-diamante-y-perla` | `pokemon-diamante-y-perla` | ✅ |
| 4 | "Shingeki no Kyojin (Attack on Titan)" | `shingeki-no-kyojin-attack-on-titan` | `shingeki-no-kyojin-attack-on-titan` | ✅ |

### Verificación de triggers:

```
trigger_name: auto_generate_slug
tabla: anime
funcion: auto_generate_slug

trigger_name: auto_generate_slug
tabla: manga
funcion: auto_generate_slug_manga

trigger_name: auto_generate_slug
tabla: novels
funcion: auto_generate_slug_novel
```

✅ Todos los triggers activos y funcionando.

## 🎨 Cómo Funciona el Slug

### Proceso de normalización:

1. **Convertir a minúsculas**
   ```
   "Dragon Ball Z" → "dragon ball z"
   ```

2. **Quitar acentos**
   ```
   "Pokémon" → "pokemon"
   "Café" → "cafe"
   ```

3. **Quitar caracteres especiales**
   ```
   "One Piece & Coffee!" → "one piece  coffee"
   "[Título]: Test" → "titulo test"
   ```

4. **Normalizar espacios**
   ```
   "dragon  ball   z" → "dragon ball z"
   ```

5. **Reemplazar espacios por guiones**
   ```
   "dragon ball z" → "dragon-ball-z"
   ```

6. **Quitar guiones duplicados**
   ```
   "one--piece---test" → "one-piece-test"
   ```

7. **Quitar guiones al inicio/final**
   ```
   "-dragon-ball-z-" → "dragon-ball-z"
   ```

8. **Limitar a 255 caracteres**
   ```
   "titulo-muy-largo..." → "titulo-muy-largo...[255 chars]"
   ```

## ⚠️ Manejo de Duplicados

### Problema potencial:

Si dos anime tienen el mismo título:
- "Dragon Ball Z" → `dragon-ball-z`
- "Dragon Ball Z" (remake) → `dragon-ball-z` ❌ CONFLICTO

### Soluciones posibles:

#### Opción 1: Constraint UNIQUE con manejo en API ✅ (Recomendado)

En el código API, si el slug ya existe, agregar sufijo:
```typescript
let slug = generateSlug(title);
let attempt = 1;

while (await slugExists(slug)) {
  slug = `${generateSlug(title)}-${attempt}`;
  attempt++;
}
// Resultado: dragon-ball-z-2, dragon-ball-z-3, etc.
```

#### Opción 2: Constraint UNIQUE en BD + error

```sql
ALTER TABLE app.anime 
ADD CONSTRAINT unique_anime_slug UNIQUE (slug);
```

Si hay duplicado → error → usuario debe cambiar título.

#### Opción 3: Agregar año al slug

```typescript
// En el formulario, incluir año
const slug = `${generateSlug(title)}-${year}`;
// Resultado: dragon-ball-z-1989, dragon-ball-z-2024
```

**Recomendación:** Usar Opción 1 en el código API para no molestar al usuario.

## 📊 Estado Actual

### Función generate_slug:
```
✅ Parámetros: 1 (title TEXT)
✅ Retorna: VARCHAR(255)
✅ Sin ID en el slug
✅ Normalización completa de caracteres
```

### Triggers:
```
✅ anime → auto_generate_slug (actualizado)
✅ manga → auto_generate_slug_manga (actualizado)
✅ novels → auto_generate_slug_novel (actualizado)
```

### Tests:
```
✅ 4/4 tests pasados
✅ Acentos normalizados correctamente
✅ Caracteres especiales eliminados
✅ Formato correcto (kebab-case)
```

## 🚀 Próximo Paso

Ya puedes volver a intentar aprobar la contribución:

1. Ve a: http://localhost:9002/dashboard/moderator/contributions/1
2. Click en "Aprobar Contribución"
3. **Resultado esperado:**
   - ✅ Anime creado exitosamente
   - ✅ Slug generado automáticamente (sin ID)
   - ✅ Sin errores

## 🔍 Cómo Verificar el Slug Generado

Después de aprobar, ejecuta en PostgreSQL:

```sql
-- Ver el anime recién creado
SELECT id, title_romaji, slug, created_at
FROM app.anime
ORDER BY created_at DESC
LIMIT 1;

-- Ejemplo de resultado esperado:
-- id: 123
-- title_romaji: "Dragon Ball Z"
-- slug: "dragon-ball-z"  ← Sin ID!
-- created_at: 2025-10-17 ...
```

## 📝 Nota Importante

Si ya existen anime con slugs que incluyen ID (formato antiguo), puedes actualizarlos con:

```sql
-- OPCIONAL: Regenerar todos los slugs sin ID
UPDATE app.anime 
SET slug = app.generate_slug(
  COALESCE(title_romaji, title_english, title_native)
);
```

⚠️ **Advertencia:** Esto cambiará las URLs existentes. Solo hazlo si estás seguro.

---

**Script ejecutado:** `docs/FIX-SLUG-SIN-ID.sql`  
**Fecha:** 17 de octubre de 2025  
**Estado:** ✅ Completado exitosamente
