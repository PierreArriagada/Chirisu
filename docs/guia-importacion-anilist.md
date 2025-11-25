# Guía de Importación Masiva desde AniList

## ✅ Sistema Simplificado - Solo AniList

MyAnimeList ha sido removido. El sistema ahora solo usa **AniList** como fuente de datos única.

### Ventajas de AniList:
- ✅ API pública, no requiere autenticación
- ✅ Datos más completos (personajes, actores de voz, staff)
- ✅ Soporta Manga, Manhwa, Manhua, Novelas
- ✅ Más rápido y confiable

---

## 📊 Comandos de Importación

### 1. Importar Anime (con personajes, actores, staff, studios)

```bash
# Probar con pocos items (2 páginas = 100 anime)
npm run import run -- -s anilist -t anime -l 2

# Importación media (500 anime)
npm run import run -- -s anilist -t anime -l 500

# Importación masiva (5000 anime)
npm run import run -- -s anilist -t anime -l 5000

# Importar TODO (10,000+)
npm run import run -- -s anilist -t anime -l 50000
```

### 2. Importar Manga (incluye manhwa, manhua, novelas)

```bash
# Probar con pocos items
npm run import run -- -s anilist -t manga -l 2

# Importación media
npm run import run -- -s anilist -t manga -l 500

# Importación masiva
npm run import run -- -s anilist -t manga -l 5000

# Importar TODO
npm run import run -- -s anilist -t manga -l 50000
```

### 3. Importar TODO (anime + manga)

```bash
# Importación completa de ambos tipos
npm run import all -- -s anilist -l 50000
```

---

## ⚙️ Opciones Disponibles

| Opción | Descripción | Ejemplo |
|--------|-------------|---------|
| `-s, --source` | Fuente (solo `anilist`) | `-s anilist` |
| `-t, --type` | Tipo (`anime` o `manga`) | `-t anime` |
| `-l, --limit` | Límite de items | `-l 1000` |
| `-r, --resume` | Continuar desde checkpoint | `-r` |
| `-d, --dry-run` | Simular sin insertar en BD | `-d` |

---

## 📈 Gestión de Checkpoints

### Ver estado de importaciones
```bash
npm run import status
```

### Ver resumen detallado
```bash
npm run import summary -- -s anilist -t anime
npm run import summary -- -s anilist -t manga
```

### Continuar importación interrumpida
```bash
npm run import run -- -s anilist -t anime -r
```

### Eliminar checkpoint (empezar de cero)
```bash
npm run import delete -- -s anilist -t anime
```

### Limpiar checkpoints antiguos (30 días)
```bash
npm run import cleanup
```

---

## 🎯 Datos que se Importan

### Para Anime:
- ✅ Información básica (título, sinopsis, episodios, fechas, tipo)
- ✅ **Personajes** (nombre, imagen, descripción, edad, género, rol)
- ✅ **Actores de voz** (japonés y español)
- ✅ **Staff** (director, escritor, diseñador, etc.)
- ✅ **Studios** (estudios de animación)
- ✅ **Géneros**
- ✅ País de origen (JP, KR, CN)
- ✅ Imágenes (cover, banner)
- ❌ Puntuaciones externas (se calculan internamente)

### Para Manga/Manhwa/Manhua/Novelas:
- ✅ Información básica (título, sinopsis, capítulos, volúmenes)
- ✅ **Personajes**
- ✅ **Staff** (autor, artista)
- ✅ **Géneros**
- ✅ País de origen (JP, KR, CN)
- ✅ Clasificación automática (manga/manhwa/manhua/novel)

---

## 📊 Ejemplo de Salida

```
🚀 INICIANDO IMPORTACIÓN DESDE ANILIST - ANIME

📊 Configuración:
   Página inicial: 1
   Límite: 1000 items
   Items por página: 50
   Dry run: No

📥 Fetching página 1 desde AniList...
   Recibidos: 50 items (Página 1/434)
   Procesados: 50 items
   ✅ Medios: 50 importados, 0 actualizados, 0 errores
   ✅ Personajes: 899, Actores de voz: 1102, Staff: 1191, Studios: 45
💾 Checkpoint guardado: ANILIST anime (Procesados: 50, Página: 50)
   ⏱️ Batch: 1m 16s | Total: 1m 16s
   📈 Velocidad: 39 items/min | Restante: 24m 30s
```

---

## 🚀 Plan de Importación Recomendado

### Fase 1: Prueba (10 minutos)
```bash
# Probar con pocos items para verificar
npm run import run -- -s anilist -t anime -l 2
npm run import run -- -s anilist -t manga -l 2
```

### Fase 2: Importación Media (2-3 horas)
```bash
# Importar 1000 anime y 1000 manga
npm run import run -- -s anilist -t anime -l 1000
npm run import run -- -s anilist -t manga -l 1000
```

### Fase 3: Importación Masiva (8-12 horas)
```bash
# Importar todo el catálogo
npm run import all -- -s anilist -l 50000
```

---

## ⚠️ Consideraciones

### Tiempo estimado:
- **Anime**: ~40 items/min = 25 horas para 60,000 anime
- **Manga**: ~400 items/min = 3 horas para 80,000 manga

### Rate Limits:
- AniList: 90 requests/min
- Sistema automáticamente espera si se alcanza el límite

### Interrupciones:
- Puedes pausar con `Ctrl+C`
- Reanudar con `-r` flag
- Los checkpoints se guardan cada 50 items

---

## 🔍 Verificar Datos Importados

```bash
# Contar anime importados
psql -U postgres -d bd_chirisu -c "SELECT COUNT(*) FROM app.anime;"

# Contar manga/manhwa/manhua/novelas
psql -U postgres -d bd_chirisu -c "SELECT 'manga', COUNT(*) FROM app.manga UNION ALL SELECT 'manhwa', COUNT(*) FROM app.manhwa UNION ALL SELECT 'manhua', COUNT(*) FROM app.manhua UNION ALL SELECT 'novels', COUNT(*) FROM app.novels;"

# Ver top studios
psql -U postgres -d bd_chirisu -c "SELECT s.name, COUNT(*) as anime_count FROM app.studios s JOIN app.studiable_studios ss ON s.id = ss.studio_id GROUP BY s.name ORDER BY anime_count DESC LIMIT 10;"
```

---

## 📝 Notas Importantes

1. **Solo AniList**: MyAnimeList fue removido por limitaciones de API
2. **Sin Puntuaciones**: No se importan scores externos, se calculan internamente
3. **Traducción**: Synopsis viene en inglés/japonés, traducción pendiente de implementar
4. **Backups**: Recomendado hacer backup de BD antes de importaciones masivas
