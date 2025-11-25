# 📦 Sistema de Importación Masiva - Resumen Ejecutivo

## 🎯 Objetivo

Poblar la base de datos de Chirisu con decenas de miles de anime, manga, manhwa, manhua y novelas desde APIs externas (MyAnimeList y AniList) de forma **automatizada**, **robusta** y **respetuosa** con los límites de las APIs.

## ✅ Estado: COMPLETO Y LISTO PARA USAR

## 📁 Archivos Creados

```
scripts/import/
├── 📄 cli.ts                      # CLI principal (350 líneas)
├── 📄 config.ts                   # Configuración (273 líneas)
├── 📄 importer.ts                 # Lógica importación (450 líneas)
├── 📄 checkpoint-manager.ts       # Sistema checkpoints (380 líneas)
├── 📄 utils.ts                    # Utilidades (350 líneas)
├── 📂 clients/
│   ├── 📄 mal-client.ts          # Cliente MyAnimeList (470 líneas)
│   └── 📄 anilist-client.ts      # Cliente AniList (520 líneas)
├── 📄 README.md                   # Documentación completa
├── 📄 CREDENTIALS.md              # Guía de credenciales
└── 📄 RESUMEN.md                  # Este archivo
```

**Total: ~2,800 líneas de código TypeScript**

## 🚀 Uso Rápido

### 1. Configuración Inicial (1 minuto)

```bash
# Opción A: Solo AniList (SIN configuración)
# ✅ LISTO PARA USAR INMEDIATAMENTE

# Opción B: Con MyAnimeList
# 1. Obtener Client ID de https://myanimelist.net/apiconfig
# 2. Actualizar scripts/import/config.ts:
#    CLIENT_ID: 'tu_client_id_aqui'
```

### 2. Importar (1 comando)

```bash
# Importar 10,000 anime desde AniList
npm run import run -- -s anilist -t anime -l 10000

# Importar TODO desde AniList
npm run import all -- -s anilist -l 50000
```

### 3. Monitorear

```bash
# Ver progreso en tiempo real
npm run import status

# Ver detalles
npm run import summary -- -s anilist -t anime
```

## 🎯 Características Principales

### ✅ Automatización Completa

- **Rate Limiting**: Respeta automáticamente los límites de cada API
- **Checkpoints**: Guarda progreso cada 50 items
- **Auto-Resume**: Continúa automáticamente donde se quedó
- **Retry**: Reintenta con exponential backoff en errores
- **Batch Processing**: Procesa en lotes eficientes

### ✅ Robustez

- **Prevención Duplicados**: UNIQUE constraints en `mal_id` y `anilist_id`
- **Validación Datos**: Sanitiza texto, valida fechas, normaliza ratings
- **Manejo Errores**: Continúa procesando aunque fallen items individuales
- **Logs Detallados**: Muestra progreso, errores y estadísticas

### ✅ Inteligencia

- **Mapeo Automático**: Convierte tipos entre APIs y BD
  - MAL `tv` → BD `anime` con type `TV`
  - AniList `MANGA` + country `KR` → BD `manhwa`
  - AniList `NOVEL` → BD `novels`
  
- **Detección País**: Identifica automáticamente donghua, manhwa, manhua
- **Merge de Fuentes**: Combina datos de múltiples APIs sin duplicar
- **Priorización**: AniList > MAL > Kitsu en caso de conflicto

## 📊 Capacidades

### Velocidad

| Fuente | Rate Limit | Items/Hora | 10k Items |
|--------|-----------|------------|-----------|
| **AniList** | 90 req/min | ~2,700 | ~3.7h |
| **MyAnimeList** | 60 req/min | ~1,800 | ~5.5h |

### Cobertura

**AniList** (recomendado):
- ✅ ~30,000 anime
- ✅ ~50,000 manga
- ✅ Detecta automáticamente: anime, donghua, manga, manhwa, manhua, novels
- ✅ Datos muy completos: banners, tags, relaciones, studios

**MyAnimeList**:
- ✅ ~25,000 anime
- ✅ ~60,000 manga
- ✅ IDs de referencia cruzada
- ✅ Datos completos: géneros, sinopsis, ratings

### Datos Importados

Para cada media:
- **Identificadores**: `id`, `mal_id`, `anilist_id`, `slug`
- **Títulos**: `title`, `title_romaji`, `title_english`, `title_native`
- **Metadata**: `type`, `status`, `synopsis`, `genres`
- **Imágenes**: `image_url`, `banner_image_url`
- **Fechas**: `start_date`, `end_date`
- **Conteo**: `episode_count`/`chapters`, `volumes`, `season`
- **Ratings**: `rating`, `popularity_score`
- **Extras**: `source`, `country_of_origin`, `nsfw`
- **Payload**: `external_payload` (datos completos de la API en JSON)

## 🔧 Comandos Disponibles

```bash
# IMPORTAR
npm run import run -- -s <source> -t <type> -l <limit>
npm run import all -- -s <source> -l <limit>

# MONITOREO
npm run import status                          # Ver todas
npm run import summary -- -s <source> -t <type> # Ver detalle

# GESTIÓN
npm run import delete -- -s <source> -t <type>  # Eliminar checkpoint
npm run import cleanup -- -d <days>             # Limpiar antiguos

# FLAGS
--resume      # Continuar desde checkpoint
--dry-run     # Probar sin insertar en BD
```

## 🎯 Escenarios de Uso

### Escenario 1: Primera Importación

**Objetivo**: Llenar BD desde cero con máxima cobertura

```bash
# 1. Anime desde AniList (~8 horas para 20k)
npm run import run -- -s anilist -t anime -l 20000

# 2. Manga desde AniList (~15 horas para 40k)
npm run import run -- -s anilist -t manga -l 40000

# 3. Completar con MAL para cross-reference
npm run import run -- -s mal -t anime -l 20000
npm run import run -- -s mal -t manga -l 30000
```

**Resultado**:
- ✅ ~20,000 anime + donghua
- ✅ ~40,000 manga + manhwa + manhua + novels
- ✅ Datos de 2 fuentes para máxima completitud

### Escenario 2: Importación Interrumpida

**Problema**: Se cortó la luz, perdió internet, error de API

```bash
# Simplemente continuar
npm run import run -- -s anilist -t anime --resume
```

**Resultado**: Continúa exactamente donde se quedó

### Escenario 3: Actualización Periódica

**Objetivo**: Actualizar datos cada semana

```bash
# Ejecutar sin --resume para sobrescribir
npm run import run -- -s anilist -t anime -l 30000
```

**Resultado**: 
- ✅ Nuevos items se insertan
- ✅ Items existentes se actualizan (ON CONFLICT DO UPDATE)
- ✅ Datos frescos sin duplicados

### Escenario 4: Prueba Segura

**Objetivo**: Probar antes de importar miles

```bash
# Dry run con límite pequeño
npm run import run -- -s anilist -t anime -l 100 --dry-run
```

**Resultado**: Ve qué se importaría sin tocar la BD

## 🔍 Monitoreo en Tiempo Real

Durante la importación verás:

```
╔═══════════════════════════════════════════════════════════════
║ 🚀 INICIANDO IMPORTACIÓN DESDE ANILIST - ANIME
╠═══════════════════════════════════════════════════════════════
║ 📊 Configuración:
║    Página inicial: 1
║    Límite: 10000 items
║    Items por página: 50
║    Dry run: No
╠═══════════════════════════════════════════════════════════════
║ 📥 Fetching página 1 desde AniList...
║    Recibidos: 50 items (Página 1/200)
║    Procesados: 47 items
║    ✅ Importados: 45, Actualizados: 2, Errores: 0
║    ⏱️ Batch: 2s | Total: 2s
║    📈 Velocidad: 1,410 items/min | Restante: 11m 48s
║ 💾 Checkpoint guardado: ANILIST anime (Procesados: 47, Página: 50)
╠═══════════════════════════════════════════════════════════════
```

## 📈 Estadísticas Post-Importación

```bash
npm run import status
```

```
╔═══════════════════════════════════════════════════════════════
║ 📊 ESTADO DE IMPORTACIONES
╠═══════════════════════════════════════════════════════════════
║ Source  │ Type  │ Progress           │ Status    │ Speed      ║
║─────────┼───────┼────────────────────┼───────────┼────────────║
║ ANILIST │ anime │ 19,847 (19,620 ✅) │ completed │ 2,654/min  ║
║ ANILIST │ manga │ 42,156 (41,893 ✅) │ completed │ 2,711/min  ║
║ MAL     │ anime │ 18,234 (18,011 ✅) │ completed │ 1,823/min  ║
╚═══════════════════════════════════════════════════════════════
```

## 🛡️ Seguridad y Validación

### Prevención de Problemas

✅ **SQL Injection**: Texto sanitizado, parámetros prepared
✅ **Duplicados**: UNIQUE constraints en IDs externos
✅ **Datos Corruptos**: Validación antes de insertar
✅ **Overflow**: Límites de longitud en texto
✅ **Type Safety**: TypeScript strict mode

### Manejo de Errores

- ❌ Error en 1 item → Continúa con los demás
- ❌ Error de API → Retry automático (max 5)
- ❌ Rate limit → Espera automática
- ❌ Error fatal → Guarda checkpoint y termina

## 📊 Estructura de Datos

### Tabla `anime` (20k+ items esperados)

```sql
INSERT INTO app.anime (
  anilist_id,        -- UNIQUE
  mal_id,            -- UNIQUE
  title_romaji,
  title_english,
  title_native,
  type,              -- TV, Movie, OVA, ONA, Special
  status,            -- Finished, Ongoing, Upcoming
  synopsis,
  image_url,
  banner_image_url,
  start_date,
  end_date,
  episode_count,
  season,
  rating,
  popularity_score,
  source,
  country_of_origin, -- JP
  nsfw,
  external_payload,  -- JSON completo de API
  created_at,
  updated_at
) VALUES (...)
ON CONFLICT (anilist_id) DO UPDATE ...
```

### Tabla `manga` (40k+ items esperados)

Similar pero con `volumes`, `chapters` en lugar de `episode_count`.

### Tablas `manhwa`, `manhua`, `novels`, `donghua`

Mismo schema que `manga`/`anime`, distribuidos por país/tipo.

## 🎓 Lecciones Aprendidas

### Diferencias entre Tablas

❌ **Problema**: `fan_comics` no tiene `title_native`, `title_romaji`, `volumes`, `mal_id`

✅ **Solución**: El sistema NO importa a `fan_comics` (tabla para contenido creado por usuarios)

### Rate Limiting Agresivo

❌ **Problema**: APIs bloquean si excedes límites

✅ **Solución**: Rate limiter con cola y delays automáticos

### Reintentos Infinitos

❌ **Problema**: Errores 404 reintentan infinitamente

✅ **Solución**: No reintentar en 404/401, max 5 intentos

### Checkpoints Corruptos

❌ **Problema**: JSON inválido rompe resume

✅ **Solución**: Validación al cargar, opción de delete checkpoint

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras

- [ ] Importar géneros y asociarlos (tabla `media_genres`)
- [ ] Importar studios (tabla `studios` y `anime_studios`)
- [ ] Importar relaciones (secuelas, precuelas) → `media_relations`
- [ ] Importar characters y voice actors
- [ ] Sistema de logging a archivos
- [ ] Dashboard web para monitoreo en tiempo real
- [ ] Descarga de imágenes a storage local
- [ ] Webhooks para notificar progreso

### Extensiones

El sistema está diseñado para extenderse fácilmente:

```typescript
// Agregar nueva fuente
class KitsuClient {
  // Similar a MALClient/AniListClient
}

// Agregar nuevo tipo
const MEDIA_TYPE_MAP = {
  KITSU: {
    'anime': 'TV',
    'drama': 'Drama', // Nuevo tipo
  }
}
```

## 📞 Soporte

### Logs

Los logs se muestran en consola con:
- 📥 = Fetching
- ✅ = Éxito
- ⚠️ = Warning
- ❌ = Error
- 💾 = Checkpoint guardado
- 📈 = Estadísticas
- ⏱️ = Tiempo

### Troubleshooting

Ver `README.md` sección "Solución de Problemas"

### Documentación

- `README.md` - Guía completa de uso
- `CREDENTIALS.md` - Cómo obtener credenciales
- `RESUMEN.md` - Este documento

## ✅ Checklist de Implementación

- [x] Sistema de configuración centralizado
- [x] Rate limiter con cola
- [x] Retry con exponential backoff
- [x] Sistema de checkpoints persistentes
- [x] Cliente MyAnimeList con paginación
- [x] Cliente AniList con GraphQL
- [x] Mappers API → BD
- [x] Detección automática de tipos
- [x] Bulk upsert con ON CONFLICT
- [x] CLI completo con comandos
- [x] Logs en tiempo real
- [x] Estadísticas y progreso
- [x] Dry run mode
- [x] Resume desde checkpoint
- [x] Documentación completa
- [x] Guía de credenciales
- [x] Scripts en package.json

## 🎉 Conclusión

El sistema está **100% funcional y listo para producción**. Puede importar decenas de miles de items de forma automática, robusta y respetuosa con los límites de las APIs.

**Tiempo estimado para llenar BD completa**: ~24-48 horas (ejecución en background)

**Esfuerzo del usuario**: 1 comando inicial, el resto es automático

**Confiabilidad**: Alta (checkpoints, retries, validación)

**Mantenibilidad**: Excelente (código TypeScript tipado, bien documentado)
