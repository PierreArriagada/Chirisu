# 📖 Guía Práctica - Sistema de Colores Automático

## Escenarios de Uso Comunes

### 🆕 Escenario 1: Importar Nuevos Anime

**Situación:** Quieres agregar los últimos 10 anime de la temporada actual.

**Comando:**
```bash
npm run import run -- -s anilist -t anime -l 10
```

**Lo que sucede:**
1. ✅ Se obtienen 10 anime desde AniList
2. ✅ Para cada uno:
   - Si AniList provee color → Se usa directamente
   - Si NO provee color → Se extrae automáticamente de la imagen
3. ✅ Se guardan en BD con color ya calculado
4. ✅ Listos para visualizar en UI

**Tiempo estimado:** 30-60 segundos (dependiendo de cuántos requieran extracción)

**Ejemplo de salida:**
```
╔══════════════════════════════════════════════════════════════════╗
║              IMPORTACIÓN DESDE ANILIST - ANIME                   ║
╚══════════════════════════════════════════════════════════════════╝

📋 Configuración:
   Fuente: anilist
   Tipo: anime
   Límite: 10

🔄 Obteniendo datos de AniList...
✅ Obtenidos 10 medios de AniList

[1/10] Frieren: Beyond Journey's End...
   ✅ Color de AniList: #86E1E1
   ✅ Insertado: Frieren (ID: 510)

[2/10] Solo Leveling...
   🎨 Extrayendo color dominante para "Solo Leveling"...
   ✅ Color extraído: #3050D0
   ✅ Insertado: Solo Leveling (ID: 511)

[3/10] Demon Slayer Season 4...
   ✅ Color de AniList: #BB5A50
   ✅ Insertado: Demon Slayer (ID: 512)

...

✅ IMPORTACIÓN COMPLETADA
   Total procesados: 10
   Éxitos: 10
   Fallidos: 0
```

---

### 🔄 Escenario 2: Actualizar Medios Sin Color

**Situación:** Tienes medios antiguos que fueron importados antes de la mejora del sistema y no tienen color.

**Paso 1: Ver cuántos necesitan actualización (sin modificar)**
```bash
npm run update-colors -- --dry-run
```

**Salida esperada:**
```
╔═══════════════════════════════════════════════════════════════════╗
║     ACTUALIZACIÓN DE COLORES POR CAMBIO DE IMAGEN                 ║
╚═══════════════════════════════════════════════════════════════════╝

⚠️  MODO DRY RUN: Se mostrarán los cambios pero no se guardarán

======================================================================
🔄 PROCESANDO: ANIME
======================================================================
📊 Medios a procesar: 15
🔍 MODO DRY RUN: No se realizarán cambios reales

[1/15] Naruto...
   🎨 Extrayendo color para "Naruto"...
   🔍 [DRY RUN] Se actualizaría a: #F07818

[2/15] One Piece...
   🎨 Extrayendo color para "One Piece"...
   🔍 [DRY RUN] Se actualizaría a: #E85D75

...

======================================================================
📊 RESUMEN: ANIME
======================================================================
   Procesados: 15
   ✅ Actualizados: 15
   ❌ Fallidos: 0
======================================================================

💡 Para aplicar los cambios, ejecuta sin --dry-run
```

**Paso 2: Aplicar los cambios**
```bash
npm run update-colors
```

**Salida esperada:**
```
======================================================================
🔄 PROCESANDO: ANIME
======================================================================
📊 Medios a procesar: 15

🚀 Iniciando actualización...

[1/15] Naruto...
   🎨 Extrayendo color para "Naruto"...
   ✅ Color actualizado: #F07818

[2/15] One Piece...
   🎨 Extrayendo color para "One Piece"...
   ✅ Color actualizado: #E85D75

...

======================================================================
📊 RESUMEN TOTAL
======================================================================
   Procesados: 15
   ✅ Actualizados: 15
   ❌ Fallidos: 0
======================================================================

✅ ACTUALIZACIÓN COMPLETADA
```

---

### 🎯 Escenario 3: Actualizar Solo Un Tipo de Medio

**Situación:** Solo quieres actualizar los manga sin color.

**Comando:**
```bash
npm run update-colors -- --type manga
```

**Variantes:**
```bash
# Solo anime
npm run update-colors -- --type anime

# Solo manhwa
npm run update-colors -- --type manhwa

# Solo manhua
npm run update-colors -- --type manhua

# Solo novels
npm run update-colors -- --type novels
```

---

### ⚡ Escenario 4: Actualización Parcial (Por Lotes)

**Situación:** Tienes 100 medios sin color pero quieres actualizar de 10 en 10.

**Comando:**
```bash
# Actualizar primeros 10
npm run update-colors -- --limit 10

# Ver primeros 10 sin modificar
npm run update-colors -- --limit 10 --dry-run

# Combinar con tipo específico
npm run update-colors -- --type anime --limit 10
```

**Por qué hacer esto:**
- Control de recursos (no saturar CPU/red)
- Monitorear progreso gradualmente
- Detener si algo sale mal

**Proceso sugerido:**
```bash
# 1. Ver cuántos hay
npm run update-colors -- --dry-run

# 2. Actualizar 10 de prueba
npm run update-colors -- --limit 10

# 3. Verificar en BD que funcionó
# (Ver consulta SQL abajo)

# 4. Actualizar el resto
npm run update-colors
```

---

### 🔍 Escenario 5: Verificar Colores en Base de Datos

**Situación:** Quieres confirmar que los colores se guardaron correctamente.

**Consulta 1: Ver últimos 10 anime con colores**
```sql
SELECT 
  id, 
  title_romaji, 
  dominant_color, 
  cover_image_url 
FROM app.anime 
ORDER BY id DESC 
LIMIT 10;
```

**Resultado esperado:**
```
 id  | title_romaji              | dominant_color | cover_image_url
-----+---------------------------+----------------+------------------
 510 | Frieren                   | #86E1E1        | https://...
 509 | Solo Leveling             | #3050D0        | https://...
 508 | Demon Slayer S4           | #BB5A50        | https://...
```

**Consulta 2: Contar medios SIN color**
```sql
SELECT 
  'anime' AS type, 
  COUNT(*) AS sin_color,
  (SELECT COUNT(*) FROM app.anime) AS total
FROM app.anime 
WHERE dominant_color IS NULL

UNION ALL

SELECT 
  'manga', 
  COUNT(*),
  (SELECT COUNT(*) FROM app.manga)
FROM app.manga 
WHERE dominant_color IS NULL;
```

**Resultado ideal:**
```
 type  | sin_color | total
-------+-----------+-------
 anime |     0     |  499
 manga |     0     |  448
```

**Consulta 3: Ver distribución de colores**
```sql
SELECT 
  dominant_color,
  COUNT(*) AS cantidad
FROM app.anime
WHERE dominant_color IS NOT NULL
GROUP BY dominant_color
ORDER BY cantidad DESC
LIMIT 10;
```

**Resultado:**
```
 dominant_color | cantidad
----------------+----------
 #F0F0F0        |    56    (Blanco/Gris claro)
 #0090D0        |    45    (Azul cyan)
 #F0D000        |    38    (Amarillo brillante)
 #D00000        |    32    (Rojo intenso)
 #86E1E1        |    28    (Turquesa)
```

---

### 🎨 Escenario 6: Verificar Colores en UI

**Situación:** Quieres ver cómo se ven los colores en la interfaz.

**Pasos:**

1. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

2. **Abrir navegador:**
```
http://localhost:9002
```

3. **Navegar a un anime específico:**
```
http://localhost:9002/anime/510
```

4. **Observar el tema dinámico:**
- Fondo: Color dominante extraído
- Cards: Mismo color pero ajustado
- Texto: Blanco (modo oscuro) o Negro (modo claro)

5. **Cambiar entre modo claro/oscuro:**
- Click en el botón de tema (sol/luna)
- Observar cómo se adapta automáticamente

---

### 🔧 Escenario 7: Importación Masiva

**Situación:** Quieres importar 50+ anime y asegurarte de que todos tengan color.

**Estrategia recomendada:**

```bash
# Paso 1: Importar en lotes pequeños para monitorear
npm run import run -- -s anilist -t anime -l 10

# Paso 2: Esperar 30 segundos (para no saturar AniList)

# Paso 3: Repetir hasta completar
npm run import run -- -s anilist -t anime -l 10

# Paso 4: Verificar cuántos tienen color
```

**Consulta SQL para verificar:**
```sql
SELECT 
  COUNT(*) AS total,
  COUNT(dominant_color) AS con_color,
  COUNT(*) - COUNT(dominant_color) AS sin_color
FROM app.anime;
```

**Si algunos quedan sin color:**
```bash
# Actualizar los que faltan
npm run update-colors -- --type anime
```

---

### ⚡ Escenario 8: Re-extracción Forzada

**Situación:** Mejoraste el algoritmo y quieres re-calcular todos los colores.

**⚠️ ADVERTENCIA:** Esto toma ~50 minutos para 997 medios (3 seg/imagen)

**Paso 1: Hacer backup de la BD**
```bash
pg_dump bd_chirisu > backup_$(date +%Y%m%d).sql
```

**Paso 2: Re-extraer (forzado)**
```bash
npm run extract-colors -- --force
```

**Paso 3: Verificar resultados**
```sql
SELECT dominant_color, COUNT(*) 
FROM app.anime 
GROUP BY dominant_color 
ORDER BY COUNT(*) DESC 
LIMIT 10;
```

---

### 🐛 Escenario 9: Debugging de Extracción Fallida

**Situación:** Un anime específico no tiene color y quieres investigar por qué.

**Paso 1: Verificar en BD**
```sql
SELECT 
  id,
  title_romaji,
  cover_image_url,
  dominant_color
FROM app.anime
WHERE id = 510;
```

**Paso 2: Verificar la URL de la imagen**
```bash
# En PowerShell
Invoke-WebRequest -Uri "https://s4.anilist.co/file/..." -Method Head
```

**Paso 3: Intentar extracción manual**
```bash
# Opción 1: Usar update-colors para ese ID específico
npm run update-colors -- --type anime --limit 1

# Opción 2: Crear script temporal de prueba
```

**Script temporal (`test-color.ts`):**
```typescript
import { extractDominantColorHex } from './src/lib/color-extractor';

const testUrl = "https://s4.anilist.co/file/...";

extractDominantColorHex(testUrl)
  .then(color => console.log('Color:', color))
  .catch(err => console.error('Error:', err));
```

**Ejecutar:**
```bash
tsx test-color.ts
```

---

### 🎯 Escenario 10: Configurar Tarea Programada

**Situación:** Quieres que los colores se actualicen automáticamente cada semana.

**Windows (Task Scheduler):**

1. Crear archivo `.bat`:
```batch
@echo off
cd C:\Users\boris\OneDrive\Documentos\Chirisu
call npm run update-colors
```

2. Guardar como: `update-colors.bat`

3. Crear tarea programada:
   - Abrir "Task Scheduler" (Programador de Tareas)
   - Acción → Crear Tarea Básica
   - Nombre: "Actualizar Colores Chirisu"
   - Trigger: Semanal (Domingo 3:00 AM)
   - Acción: Iniciar programa
   - Programa: `C:\Users\boris\OneDrive\Documentos\Chirisu\update-colors.bat`

**Linux/macOS (Cron):**

```bash
# Editar crontab
crontab -e

# Agregar línea (cada domingo 3:00 AM)
0 3 * * 0 cd /path/to/Chirisu && npm run update-colors
```

---

## 📊 Métricas de Rendimiento

### Tiempos Estimados

| Operación | Cantidad | Tiempo |
|-----------|----------|--------|
| Importar con color de AniList | 10 anime | ~10 seg |
| Importar con extracción automática | 10 anime | ~40 seg |
| Actualizar colores existentes | 10 medios | ~30 seg |
| Re-extracción completa forzada | 997 medios | ~50 min |

### Recursos Utilizados

| Recurso | Uso |
|---------|-----|
| CPU | Moderado (Sharp para procesamiento de imagen) |
| Memoria | ~100-200 MB |
| Red | Mínimo (solo descarga de imágenes) |
| Disco | Mínimo (solo BD) |

---

## ✅ Checklist Post-Importación

Después de importar nuevos medios, verifica:

- [ ] Todos tienen `dominant_color` en BD
- [ ] Los colores son variados (no todos grises)
- [ ] Se ven correctamente en UI
- [ ] Tema dinámico se aplica correctamente
- [ ] Textos son legibles (blanco en oscuro, negro en claro)
- [ ] Cards armonizan con fondo

**Comando de verificación rápida:**
```sql
SELECT 
  COUNT(*) AS total,
  COUNT(dominant_color) AS con_color,
  COUNT(*) - COUNT(dominant_color) AS sin_color,
  ROUND(COUNT(dominant_color)::numeric / COUNT(*) * 100, 2) || '%' AS porcentaje
FROM app.anime;
```

**Resultado ideal:**
```
 total | con_color | sin_color | porcentaje
-------+-----------+-----------+------------
  499  |    499    |     0     |  100.00%
```

---

## 🎉 Conclusión

Con esta guía práctica puedes manejar todos los escenarios comunes del sistema de colores automático. El sistema está diseñado para ser **100% automático** en la mayoría de casos, solo requiriendo intervención manual para casos excepcionales.

**Flujo normal recomendado:**
1. Importar medios: `npm run import run -- -s anilist -t anime -l 10`
2. Verificar en BD que todos tienen color
3. Disfrutar de la UI con temas dinámicos 🎨

¡El sistema hace el resto automáticamente! 🚀
