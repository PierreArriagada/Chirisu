# Sistema de Extracción de Colores Dominantes

## Descripción

Sistema robusto para extraer y cachear colores dominantes de imágenes de portada de medios (anime, manga, manhwa, etc.).

## Características

✅ **Extracción en Backend** - Sin problemas de CORS  
✅ **Caché en Base de Datos** - Color guardado en columna `dominant_color`  
✅ **Detección de Cambios** - Recalcula solo si la imagen cambió  
✅ **Soporte URLs Externas** - Funciona con AniList, MAL, etc.  
✅ **Optimización Automática** - Usa color de BD si existe  

## Flujo de Trabajo

### 1. Importación desde AniList

Cuando importas medios desde AniList, el color se guarda automáticamente:

```bash
npm run import run -- -s anilist -t anime -l 10
```

AniList provee `coverImage.color` que se guarda en `dominant_color`.

### 2. Extracción Manual (para medios sin color)

Para extraer colores de medios existentes sin color:

```bash
# Extraer colores de TODOS los tipos sin color
npm run extract-colors

# Extraer solo anime
npm run extract-colors -- --type anime

# Extraer primeros 100 manga
npm run extract-colors -- --type manga --limit 100

# FORZAR recalcular TODOS (incluso los que tienen color)
npm run extract-colors -- --force
```

### 3. API Endpoint (extracción individual)

Endpoint: `POST /api/media/extract-color`

```json
{
  "mediaId": 123,
  "mediaType": "anime",
  "imageUrl": "https://...",
  "force": false
}
```

Respuesta:

```json
{
  "success": true,
  "color": "#FF5733",
  "updated": true,
  "cached": false
}
```

## Estructura de Base de Datos

Todas las tablas de medios tienen la columna:

```sql
dominant_color VARCHAR(7)  -- Ejemplo: #FF5733
```

Tablas afectadas:
- `app.anime`
- `app.manga`
- `app.manhwa`
- `app.manhua`
- `app.novels`
- `app.donghua`
- `app.fan_comics`

## Componente Frontend

`<DynamicTheme>` usa el color automáticamente:

```tsx
<DynamicTheme 
  imageUrl={media.coverImageUrl} 
  dominantColor={media.dominantColor}  // Opcional, de la BD
/>
```

**Lógica:**
1. Si `dominantColor` existe → lo usa directamente (rápido, sin CORS)
2. Si NO existe → extrae de imagen (fallback, más lento)

## Algoritmo de Extracción

1. **Descarga imagen** desde URL externa
2. **Redimensiona a 150px** (optimización velocidad)
3. **Construye histograma** de colores
4. **Filtra extremos:**
   - Muy claros (luminancia > 95%)
   - Muy oscuros (luminancia < 5%)
   - Grises (saturación < 15%)
5. **Cuantiza colores** (agrupa similares)
6. **Selecciona más frecuente** = color dominante
7. **Convierte a HEX** (#RRGGBB)
8. **Guarda en BD** con timestamp

## Optimizaciones

### Caché Multinivel

1. **BD** - Color guardado permanentemente
2. **Detección de cambios** - Solo recalcula si URL cambió
3. **Modo forzado** - `force: true` para recalcular

### Performance

- Redimensiona imágenes a 150px (vs. original 1200px+)
- Procesa en backend (no bloquea UI)
- Pausa de 50ms entre extracciones (no sobrecarga servidor)

## Ejemplo de Uso Completo

```bash
# 1. Importar anime desde AniList (color incluido)
npm run import run -- -s anilist -t anime -l 50

# 2. Verificar colores guardados
psql -U postgres -d bd_chirisu -c "
  SELECT COUNT(*) FILTER (WHERE dominant_color IS NOT NULL) as con_color,
         COUNT(*) as total
  FROM app.anime;
"

# 3. Extraer colores faltantes
npm run extract-colors -- --type anime

# 4. Ver resultado
psql -U postgres -d bd_chirisu -c "
  SELECT title_romaji, dominant_color 
  FROM app.anime 
  WHERE dominant_color IS NOT NULL 
  LIMIT 10;
"
```

## Solución de Problemas

### Error: Cannot find module 'sharp'

```bash
npm install
```

### Error: CORS al extraer color

✅ **Solucionado**: Extracción se hace en backend (Node.js), no en navegador.

### Color no se actualiza aunque cambió imagen

```bash
# Forzar recalcular
npm run extract-colors -- --type anime --force
```

### Imagen externa no accesible (403, 404)

El script registra errores pero continúa con los siguientes medios.

## Archivos Importantes

- `src/lib/color-extractor.ts` - Lógica de extracción
- `src/app/api/media/extract-color/route.ts` - API endpoint
- `scripts/extract-colors.ts` - Script CLI
- `src/components/dynamic-theme.tsx` - Componente React
- `scripts/database/migrations/add-dominant-color-column.sql` - Migración SQL

## Mantenimiento

### Recalcular todos los colores

```bash
npm run extract-colors -- --force
```

### Ver estadísticas

```bash
psql -U postgres -d bd_chirisu -c "
  SELECT 
    'anime' as tipo,
    COUNT(*) FILTER (WHERE dominant_color IS NOT NULL) as con_color,
    COUNT(*) as total
  FROM app.anime
  UNION ALL
  SELECT 'manga', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.manga
  UNION ALL
  SELECT 'manhwa', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.manhwa;
"
```
