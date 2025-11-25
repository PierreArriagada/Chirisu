# 🚀 Sistema de Importación Masiva

Sistema automatizado para importar anime, manga, manhwa, manhua y novelas desde APIs externas (MyAnimeList y AniList) a la base de datos de Chirisu.

## 📋 Características

- ✅ **Rate Limiting Inteligente**: Respeta los límites de cada API automáticamente
- ✅ **Sistema de Checkpoints**: Guarda progreso y permite continuar automáticamente
- ✅ **Retry con Exponential Backoff**: Reintenta automáticamente en caso de errores
- ✅ **Batch Processing**: Procesa en lotes de 50-100 items
- ✅ **Prevención de Duplicados**: Usa constraints UNIQUE en mal_id/anilist_id
- ✅ **Mapeo Inteligente**: Convierte automáticamente tipos entre APIs y BD
- ✅ **Estadísticas en Tiempo Real**: Muestra progreso, velocidad y tiempo estimado
- ✅ **Dry Run**: Permite probar sin insertar en BD

## 🔧 Configuración Inicial

### 1. Configurar Credenciales

Edita `scripts/import/config.ts`:

```typescript
export const API_CREDENTIALS = {
  MAL: {
    CLIENT_ID: 'TU_MAL_CLIENT_ID_AQUI',
    CLIENT_SECRET: 'TU_MAL_SECRET_AQUI', // Opcional
    BASE_URL: 'https://api.myanimelist.net/v2',
  },
  // AniList no requiere credenciales
}
```

**Obtener credenciales de MyAnimeList:**
1. Ir a https://myanimelist.net/apiconfig
2. Crear nueva aplicación
3. Copiar CLIENT_ID

### 2. Instalar Dependencias

```bash
npm install commander pg
npm install -D @types/pg
```

### 3. Inicializar Directorio de Checkpoints

El sistema creará automáticamente `scripts/import/checkpoints/` al ejecutar.

## 📖 Uso

### Comandos Básicos

#### Importar Anime desde AniList
```bash
npm run import run -- -s anilist -t anime -l 5000
```

#### Importar Manga desde MyAnimeList
```bash
npm run import run -- -s mal -t manga -l 10000
```

#### Importar TODO desde AniList (anime + manga)
```bash
npm run import all -- -s anilist -l 10000
```

#### Continuar Importación Interrumpida
```bash
npm run import run -- -s anilist -t anime --resume
```

#### Dry Run (Probar sin insertar)
```bash
npm run import run -- -s anilist -t anime -l 100 --dry-run
```

### Comandos de Monitoreo

#### Ver Estado de Todas las Importaciones
```bash
npm run import status
```

#### Ver Resumen Detallado
```bash
npm run import summary -- -s anilist -t anime
```

#### Limpiar Checkpoints Antiguos
```bash
npm run import cleanup -- -d 30
```

#### Eliminar Checkpoint Específico
```bash
npm run import delete -- -s mal -t manga
```

## 📊 Ejemplos de Uso

### Caso 1: Importación Inicial Completa

```bash
# 1. Importar anime desde AniList (más completo)
npm run import run -- -s anilist -t anime -l 20000

# 2. Importar manga desde AniList
npm run import run -- -s anilist -t manga -l 30000

# 3. Ver estadísticas
npm run import status
```

### Caso 2: Importación Interrumpida

Si la importación se interrumpe (error de red, límite de API, etc.):

```bash
# Continuar automáticamente desde donde se quedó
npm run import run -- -s anilist -t anime --resume
```

### Caso 3: Actualizar Datos Existentes

```bash
# Ejecutar sin --resume para sobrescribir desde el inicio
npm run import run -- -s anilist -t anime -l 50000
```

### Caso 4: Combinar Fuentes

```bash
# 1. Importar desde AniList (más datos)
npm run import run -- -s anilist -t anime -l 20000

# 2. Completar con MAL (para items que faltan)
npm run import run -- -s mal -t anime -l 20000

# Resultado: Los duplicados se actualizan, nuevos se insertan
```

## 🎯 Estrategia Recomendada

### Para Máxima Cobertura:

1. **Anime y Donghua**: Usar AniList (más rápido, 90 req/min)
   ```bash
   npm run import run -- -s anilist -t anime -l 30000
   ```

2. **Manga, Manhwa, Manhua**: Usar AniList
   ```bash
   npm run import run -- -s anilist -t manga -l 50000
   ```

3. **Completar con MAL**: Para IDs cruzados
   ```bash
   npm run import run -- -s mal -t anime -l 20000
   npm run import run -- -s mal -t manga -l 30000
   ```

## ⚙️ Rate Limits

| API | Límite | Delay entre Requests |
|-----|--------|---------------------|
| MyAnimeList | 60 req/min | 1000ms |
| AniList | 90 req/min | 500ms |
| Kitsu | 300 req/min | 200ms |

El sistema respeta automáticamente estos límites.

## 📁 Estructura de Archivos

```
scripts/import/
├── cli.ts                    # CLI principal
├── config.ts                 # Configuración centralizada
├── importer.ts               # Lógica de importación
├── checkpoint-manager.ts     # Sistema de checkpoints
├── utils.ts                  # Utilidades (rate limiting, retry, etc.)
├── clients/
│   ├── mal-client.ts        # Cliente MyAnimeList
│   └── anilist-client.ts    # Cliente AniList
├── checkpoints/             # Archivos de progreso (auto-generado)
│   ├── anilist_anime.json
│   ├── anilist_manga.json
│   ├── mal_anime.json
│   └── mal_manga.json
└── README.md                # Este archivo
```

## 🔍 Mapeo de Tipos

### MyAnimeList → Base de Datos

| MAL Type | BD Table | BD Type |
|----------|----------|---------|
| tv, movie, ova, ona, special | anime | TV, Movie, OVA, ONA, Special |
| manga, one_shot | manga | Manga, One-Shot |
| novel, light_novel | novels | Light_Novel |
| manhwa | manhwa | Manhwa |
| manhua | manhua | Manhua |

### AniList → Base de Datos

| AniList Format | Country | BD Table |
|----------------|---------|----------|
| TV, MOVIE, OVA, ONA, SPECIAL | JP | anime |
| TV, MOVIE, OVA, ONA, SPECIAL | CN | donghua |
| MANGA, ONE_SHOT | JP | manga |
| MANGA | KR | manhwa |
| MANGA | CN | manhua |
| NOVEL | JP/KR/CN | novels |

## 🛠️ Solución de Problemas

### Error: "MAL Client ID no configurado"

**Solución**: Actualiza `CLIENT_ID` en `scripts/import/config.ts`

### Error: "no se pudo determinar el tipo del parámetro"

**Solución**: Verifica que las columnas en la BD coincidan con la estructura esperada

### La importación va muy lenta

**Causas posibles**:
- Rate limiting normal (espera automática)
- Conexión lenta a internet
- Base de datos saturada

**Solución**: Es normal, el sistema respeta los límites de API

### Checkpoint corrupto

**Solución**:
```bash
# Eliminar checkpoint y reiniciar
npm run import delete -- -s anilist -t anime
npm run import run -- -s anilist -t anime
```

## 📈 Estadísticas Esperadas

Con los límites actuales:

| Fuente | Tipo | Items/hora | Tiempo para 10k items |
|--------|------|------------|----------------------|
| AniList | Anime | ~2,700 | ~3.7 horas |
| AniList | Manga | ~2,700 | ~3.7 horas |
| MAL | Anime | ~1,800 | ~5.5 horas |
| MAL | Manga | ~1,800 | ~5.5 horas |

## 🔐 Seguridad

- ✅ Credenciales en archivo local (no commiteadas)
- ✅ Sanitización de texto (previene SQL injection)
- ✅ Validación de datos antes de insertar
- ✅ Límites de longitud en campos de texto

## 📝 Logs

Los logs se muestran en tiempo real con:
- 📥 Fetching de datos
- ✅ Items importados/actualizados
- ⚠️ Errores individuales
- 📈 Velocidad y tiempo estimado
- 💾 Guardado de checkpoints

## 🚀 Próximas Mejoras

- [ ] Importar géneros y tags
- [ ] Importar estudios y staff
- [ ] Importar relaciones entre medios
- [ ] Sistema de logging a archivos
- [ ] Dashboard web para monitoreo
- [ ] Importar imágenes a storage local

## 📄 Licencia

Parte del proyecto Chirisu
