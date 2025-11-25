# 🚀 INICIO RÁPIDO - Sistema de Importación

## ⚡ TL;DR - Comenzar en 30 segundos

```bash
# 1. Importar 1000 anime desde AniList (SIN configuración necesaria)
npm run import run -- -s anilist -t anime -l 1000

# 2. Ver progreso
npm run import status
```

¡Eso es todo! El sistema:
- ✅ Fetches automáticamente desde AniList
- ✅ Respeta rate limits (90 req/min)
- ✅ Guarda checkpoints cada 50 items
- ✅ Inserta/actualiza en BD automáticamente
- ✅ Muestra estadísticas en tiempo real

---

## 📋 Pasos Detallados

### Paso 1: Verificar Dependencias

```bash
# Ya deberían estar instaladas, pero por si acaso:
npm install commander pg
npm install -D @types/pg
```

### Paso 2: Primera Importación (Prueba)

```bash
# Importar 100 anime como prueba
npm run import run -- -s anilist -t anime -l 100
```

**Verás algo como:**
```
╔═══════════════════════════════════════════════════════════════
║ 🚀 INICIANDO IMPORTACIÓN DESDE ANILIST - ANIME
╠═══════════════════════════════════════════════════════════════
║ 📊 Configuración:
║    Página inicial: 1
║    Límite: 100 items
║    Items por página: 50
║    Dry run: No
╠═══════════════════════════════════════════════════════════════
║ 📥 Fetching página 1 desde AniList...
║    Recibidos: 50 items (Página 1/200)
║    Procesados: 47 items
║    ✅ Importados: 45, Actualizados: 2, Errores: 0
║    ⏱️ Batch: 2s | Total: 2s
║    📈 Velocidad: 1,410 items/min | Restante: 3s
```

### Paso 3: Verificar en Base de Datos

```sql
-- Conectar a PostgreSQL
psql -U postgres -d bd_chirisu

-- Ver anime importados
SELECT id, title_romaji, title_english, type, status, rating
FROM app.anime
ORDER BY id DESC
LIMIT 10;

-- Contar total
SELECT COUNT(*) FROM app.anime;
```

### Paso 4: Importación Real (Miles de items)

```bash
# Importar 10,000 anime (~3.7 horas)
npm run import run -- -s anilist -t anime -l 10000

# Importar 20,000 manga (~7.4 horas)
npm run import run -- -s anilist -t manga -l 20000
```

**Tip**: Ejecuta en background y deja corriendo:
```bash
# Windows PowerShell
Start-Job -ScriptBlock { npm run import run -- -s anilist -t anime -l 10000 }

# Linux/Mac
nohup npm run import run -- -s anilist -t anime -l 10000 &
```

### Paso 5: Monitorear Progreso

```bash
# Ver estado de todas las importaciones
npm run import status

# Ver detalles de una específica
npm run import summary -- -s anilist -t anime
```

---

## 🎯 Comandos Más Usados

### Importar

```bash
# Anime desde AniList
npm run import run -- -s anilist -t anime -l 10000

# Manga desde AniList
npm run import run -- -s anilist -t manga -l 20000

# Todo desde AniList (anime + manga)
npm run import all -- -s anilist -l 50000

# Continuar importación interrumpida
npm run import run -- -s anilist -t anime --resume
```

### Monitorear

```bash
# Estado general
npm run import status

# Detalles específicos
npm run import summary -- -s anilist -t anime
```

### Gestión

```bash
# Eliminar checkpoint (para reiniciar)
npm run import delete -- -s anilist -t anime

# Limpiar checkpoints antiguos
npm run import cleanup -- -d 30
```

---

## 🔧 Configuración de MyAnimeList (Opcional)

Si quieres usar MyAnimeList además de AniList:

### 1. Obtener Client ID

1. Ve a https://myanimelist.net/apiconfig
2. Click "Create ID"
3. Llena el formulario:
   - App Name: `Chirisu Importer`
   - App Type: `Web`
   - Redirect URL: `http://localhost`
4. Copia tu **Client ID**

### 2. Actualizar Config

Edita `scripts/import/config.ts`:

```typescript
export const API_CREDENTIALS = {
  MAL: {
    CLIENT_ID: 'abc123def456ghi789', // ← Tu Client ID aquí
    CLIENT_SECRET: '',
    BASE_URL: 'https://api.myanimelist.net/v2',
  },
  // ...
}
```

### 3. Importar desde MAL

```bash
# Anime desde MAL
npm run import run -- -s mal -t anime -l 10000

# Manga desde MAL
npm run import run -- -s mal -t manga -l 20000
```

---

## 📊 Qué Esperar

### Velocidades

| Fuente | Items/Hora | 10k Items | 50k Items |
|--------|-----------|-----------|-----------|
| AniList | ~2,700 | ~3.7h | ~18.5h |
| MAL | ~1,800 | ~5.5h | ~27.7h |

### Datos Importados

Para cada anime/manga:
- ✅ Títulos (romaji, english, native)
- ✅ Sinopsis completa
- ✅ Imágenes (cover + banner)
- ✅ Fechas (inicio/fin)
- ✅ Episodios/Capítulos/Volúmenes
- ✅ Rating y popularidad
- ✅ Género, estado, fuente
- ✅ IDs externos (mal_id, anilist_id)
- ✅ Datos completos en JSON

### Distribución por Tabla

| Tabla | Items Esperados | Fuente |
|-------|-----------------|--------|
| `anime` | ~18,000 | AniList anime (JP) |
| `donghua` | ~2,000 | AniList anime (CN) |
| `manga` | ~35,000 | AniList manga (JP) |
| `manhwa` | ~8,000 | AniList manga (KR) |
| `manhua` | ~4,000 | AniList manga (CN) |
| `novels` | ~3,000 | AniList novels |

**Total: ~70,000 items**

---

## ❓ FAQ Rápido

### ¿Puedo detener y continuar después?

**Sí**, usa `--resume`:
```bash
npm run import run -- -s anilist -t anime --resume
```

### ¿Cómo sé si ya tengo duplicados?

No te preocupes, el sistema usa `ON CONFLICT (anilist_id) DO UPDATE`, así que:
- Si el item existe → Se actualiza
- Si es nuevo → Se inserta
- **Nunca habrá duplicados**

### ¿Puedo importar desde ambas fuentes?

**Sí**, es recomendado:
```bash
# 1. AniList primero (más datos)
npm run import run -- -s anilist -t anime -l 20000

# 2. MAL después (para mal_id)
npm run import run -- -s mal -t anime -l 20000
```

Los duplicados se actualizan con datos de ambas fuentes.

### ¿Cuánto espacio en disco necesito?

Estimación:
- **10,000 items**: ~50 MB
- **50,000 items**: ~250 MB
- **100,000 items**: ~500 MB

(Incluye texto, no imágenes)

### ¿Las imágenes se descargan?

**No** por ahora. Solo se guarda la URL en `image_url` y `banner_image_url`.

Para mostrar imágenes en el frontend, usa las URLs directamente:
```tsx
<img src={anime.image_url} alt={anime.title_romaji} />
```

### ¿Qué hago si hay un error?

El sistema:
1. ✅ Reintenta automáticamente (max 5 veces)
2. ✅ Guarda checkpoint antes de fallar
3. ✅ Puedes continuar con `--resume`

Si el error persiste:
```bash
# Ver detalles
npm run import summary -- -s anilist -t anime

# Eliminar checkpoint corrupto y reiniciar
npm run import delete -- -s anilist -t anime
npm run import run -- -s anilist -t anime
```

---

## ✅ Checklist de Verificación

Después de importar, verifica:

### 1. Conteo de Items

```sql
SELECT 
  'anime' as tabla, COUNT(*) as total FROM app.anime
UNION ALL
SELECT 'donghua', COUNT(*) FROM app.donghua
UNION ALL
SELECT 'manga', COUNT(*) FROM app.manga
UNION ALL
SELECT 'manhwa', COUNT(*) FROM app.manhwa
UNION ALL
SELECT 'manhua', COUNT(*) FROM app.manhua
UNION ALL
SELECT 'novels', COUNT(*) FROM app.novels;
```

### 2. Datos Completos

```sql
-- Verificar que tienen títulos
SELECT COUNT(*) FROM app.anime WHERE title_romaji IS NOT NULL;

-- Verificar que tienen imágenes
SELECT COUNT(*) FROM app.anime WHERE image_url IS NOT NULL;

-- Verificar que tienen rating
SELECT COUNT(*) FROM app.anime WHERE rating IS NOT NULL;
```

### 3. IDs Externos

```sql
-- Cuántos tienen anilist_id
SELECT COUNT(*) FROM app.anime WHERE anilist_id IS NOT NULL;

-- Cuántos tienen mal_id
SELECT COUNT(*) FROM app.anime WHERE mal_id IS NOT NULL;

-- Cuántos tienen ambos
SELECT COUNT(*) FROM app.anime 
WHERE anilist_id IS NOT NULL AND mal_id IS NOT NULL;
```

---

## 🎉 ¡Listo!

Ahora tienes miles de anime/manga en tu base de datos.

**Siguiente paso**: Usar los datos en tu frontend:

```typescript
// src/app/api/anime/route.ts
export async function GET() {
  const result = await pool.query(`
    SELECT id, title_romaji, title_english, image_url, rating
    FROM app.anime
    WHERE rating > 8
    ORDER BY popularity_score DESC
    LIMIT 20
  `);
  
  return Response.json(result.rows);
}
```

---

## 📚 Más Información

- Ver **README.md** para documentación completa
- Ver **CREDENTIALS.md** para configurar MAL
- Ver **RESUMEN.md** para detalles técnicos

## 🆘 Ayuda

Si algo no funciona, revisa:
1. ✅ PostgreSQL está corriendo
2. ✅ Base de datos `bd_chirisu` existe
3. ✅ Credenciales en config.ts correctas (si usas MAL)
4. ✅ Internet funcionando
5. ✅ No hay firewall bloqueando APIs

**Error común**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución**: Inicia PostgreSQL
```bash
# Windows
net start postgresql-x64-17

# Linux
sudo service postgresql start
```
