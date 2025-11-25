# ============================================================================
# SCRIPT: Importar TODOS los tipos de medios desde AniList
# ============================================================================
# DESCRIPCIÓN: Importa secuencialmente los 6 tipos de medios:
#   1. Anime
#   2. Manga
#   3. Manhwa (como manga coreano)
#   4. Manhua (como manga chino)
#   5. Novels (novelas ligeras)
#   6. Donghua (anime chino)
#
# CARACTERÍSTICAS:
#   - Sistema anti-duplicados con slugs únicos
#   - Personajes, staff y actores de voz compartidos entre medios
#   - Relaciones anime-manga automáticas
#   - Checkpoints para reanudar importación
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "IMPORTACIÓN MASIVA DE TODOS LOS TIPOS DE MEDIOS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$LIMITE_POR_TIPO = 500  # Número de páginas a importar por tipo (50 items/página)
$START_TIME = Get-Date

# Función para mostrar tiempo transcurrido
function Get-ElapsedTime {
    param($StartTime)
    $elapsed = (Get-Date) - $StartTime
    return "{0:D2}h {1:D2}m {2:D2}s" -f $elapsed.Hours, $elapsed.Minutes, $elapsed.Seconds
}

# Función para importar un tipo de medio
function Import-MediaType {
    param(
        [string]$Type,
        [int]$Limit,
        [string]$DisplayName
    )
    
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "IMPORTANDO: $DisplayName" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "Tipo: $Type" -ForegroundColor White
    Write-Host "Límite: $Limit páginas (aprox. $($Limit * 50) items)" -ForegroundColor White
    Write-Host ""
    
    $typeStartTime = Get-Date
    
    try {
        # Ejecutar importación
        npm run import run -- -s anilist -t $Type -l $Limit
        
        if ($LASTEXITCODE -eq 0) {
            $typeElapsed = Get-ElapsedTime $typeStartTime
            Write-Host ""
            Write-Host "✅ $DisplayName completado en $typeElapsed" -ForegroundColor Green
            return $true
        } else {
            Write-Host ""
            Write-Host "⚠️ $DisplayName completado con errores" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host ""
        Write-Host "❌ Error al importar $DisplayName`: $_" -ForegroundColor Red
        return $false
    }
}

# Resumen de configuración
Write-Host "📋 CONFIGURACIÓN DE IMPORTACIÓN:" -ForegroundColor Yellow
Write-Host "   • Límite por tipo: $LIMITE_POR_TIPO páginas" -ForegroundColor White
Write-Host "   • Items por página: 50" -ForegroundColor White
Write-Host "   • Total estimado: $($LIMITE_POR_TIPO * 50 * 6) items" -ForegroundColor White
Write-Host "   • Tipos a importar: 6 (anime, manga, manhwa, manhua, novels, donghua)" -ForegroundColor White
Write-Host ""
Write-Host "📊 CARACTERÍSTICAS:" -ForegroundColor Yellow
Write-Host "   ✅ Sistema anti-duplicados (slugs únicos)" -ForegroundColor Green
Write-Host "   ✅ Personajes/staff/actores compartidos entre medios" -ForegroundColor Green
Write-Host "   ✅ Relaciones anime-manga automáticas" -ForegroundColor Green
Write-Host "   ✅ Checkpoints para reanudar si falla" -ForegroundColor Green
Write-Host ""

# Confirmación
$confirmation = Read-Host "¿Continuar con la importación? (y/N)"
if ($confirmation -ne "y") {
    Write-Host ""
    Write-Host "❌ Importación cancelada" -ForegroundColor Yellow
    exit 0
}

# Resultados
$results = @()

# ============================================================================
# 1. ANIME
# ============================================================================
$result = Import-MediaType -Type "anime" -Limit $LIMITE_POR_TIPO -DisplayName "ANIME (Series japonesas)"
$results += @{Type="Anime"; Success=$result}

# ============================================================================
# 2. MANGA
# ============================================================================
$result = Import-MediaType -Type "manga" -Limit $LIMITE_POR_TIPO -DisplayName "MANGA (Comics japoneses)"
$results += @{Type="Manga"; Success=$result}

# ============================================================================
# 3. MANHWA (Manga Coreano)
# ============================================================================
# Nota: En AniList, manhwa está bajo "manga" pero filtrado por país
Write-Host ""
Write-Host "⚠️ MANHWA: Se importa como tipo 'manga' desde AniList" -ForegroundColor Yellow
Write-Host "   El sistema detectará automáticamente si es coreano y lo guardará en tabla 'manhwa'" -ForegroundColor White
# El importer ya maneja esto automáticamente con getTableForAniListMedia()

# ============================================================================
# 4. MANHUA (Manga Chino)
# ============================================================================
Write-Host ""
Write-Host "⚠️ MANHUA: Se importa como tipo 'manga' desde AniList" -ForegroundColor Yellow
Write-Host "   El sistema detectará automáticamente si es chino y lo guardará en tabla 'manhua'" -ForegroundColor White
# El importer ya maneja esto automáticamente

# ============================================================================
# 5. NOVELS (Novelas Ligeras)
# ============================================================================
# Nota: AniList no tiene endpoint separado para novels, están bajo manga con formato NOVEL
Write-Host ""
Write-Host "⚠️ NOVELS: Se importan como parte de 'manga' desde AniList" -ForegroundColor Yellow
Write-Host "   El sistema detectará automáticamente formato NOVEL y lo guardará en tabla 'novels'" -ForegroundColor White
# El importer ya maneja esto automáticamente

# ============================================================================
# 6. DONGHUA (Anime Chino)
# ============================================================================
# Nota: En AniList, donghua está bajo "anime" pero filtrado por país
Write-Host ""
Write-Host "⚠️ DONGHUA: Se importa como tipo 'anime' desde AniList" -ForegroundColor Yellow
Write-Host "   El sistema detectará automáticamente si es chino y lo guardará en tabla 'donghua'" -ForegroundColor White
# El importer ya maneja esto automáticamente

# ============================================================================
# RESUMEN FINAL
# ============================================================================

$totalElapsed = Get-ElapsedTime $START_TIME

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "IMPORTACIÓN COMPLETADA" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏱️ TIEMPO TOTAL: $totalElapsed" -ForegroundColor White
Write-Host ""
Write-Host "📊 RESULTADOS POR TIPO:" -ForegroundColor Yellow

foreach ($r in $results) {
    $status = if ($r.Success) { "✅ Exitoso" } else { "⚠️ Con errores" }
    $color = if ($r.Success) { "Green" } else { "Yellow" }
    Write-Host "   $($r.Type): $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar estado de la base de datos
Write-Host "📊 VERIFICANDO BASE DE DATOS..." -ForegroundColor Cyan
Write-Host ""

psql -U postgres -d bd_chirisu -c "
    SELECT 'ANIME' as tipo, COUNT(*) as total FROM app.anime
    UNION ALL SELECT 'MANGA', COUNT(*) FROM app.manga
    UNION ALL SELECT 'MANHWA', COUNT(*) FROM app.manhwa
    UNION ALL SELECT 'MANHUA', COUNT(*) FROM app.manhua
    UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels
    UNION ALL SELECT 'DONGHUA', COUNT(*) FROM app.donghua
    UNION ALL SELECT '---', 0
    UNION ALL SELECT 'PERSONAJES', COUNT(*) FROM app.characters
    UNION ALL SELECT 'ACTORES DE VOZ', COUNT(*) FROM app.voice_actors
    UNION ALL SELECT 'STAFF', COUNT(*) FROM app.staff
    UNION ALL SELECT 'STUDIOS', COUNT(*) FROM app.studios
    UNION ALL SELECT 'RELACIONES', COUNT(*) FROM app.media_relations
    ORDER BY tipo;
"

Write-Host ""
Write-Host "✅ Proceso completado. Revisa los resultados arriba." -ForegroundColor Green
Write-Host ""
