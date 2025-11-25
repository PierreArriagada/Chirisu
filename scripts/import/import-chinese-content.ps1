# ============================================================================
# SCRIPT: Importar contenido chino (Donghua y Manhua)
# ============================================================================
# 
# Este script importa más páginas para encontrar contenido chino que es menos
# común en AniList (ordenado por popularidad).
#
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "IMPORTACIÓN DE CONTENIDO CHINO (DONGHUA Y MANHUA)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 ESTADO ACTUAL:" -ForegroundColor Yellow
psql -U postgres -d bd_chirisu -c "SELECT 'DONGHUA' as tipo, COUNT(*) FROM app.donghua UNION ALL SELECT 'MANHUA', COUNT(*) FROM app.manhua;"

Write-Host ""
Write-Host "🚀 ESTRATEGIA:" -ForegroundColor Yellow
Write-Host "   1. Importar 1000 páginas de MANGA (~50,000 items) para encontrar manhua" -ForegroundColor White
Write-Host "   2. Importar 1000 páginas de ANIME (~50,000 items) para encontrar donghua" -ForegroundColor White
Write-Host ""

$response = Read-Host "¿Continuar con la importación masiva? (s/n)"
if ($response -ne "s" -and $response -ne "S") {
    Write-Host "❌ Importación cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "PASO 1: IMPORTAR MANGA (para encontrar manhua chinos)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
npm run import run -- -s anilist -t manga -l 1000

if ($LASTEXITCODE -eq 0) {
    $elapsed = (Get-Date) - $startTime
    Write-Host ""
    Write-Host "✅ Manga completado en $($elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📊 RESULTADOS MANGA:" -ForegroundColor Yellow
    psql -U postgres -d bd_chirisu -c "SELECT 'MANGA (JP)' as tipo, COUNT(*) FROM app.manga UNION ALL SELECT 'MANHWA (KR)', COUNT(*) FROM app.manhwa UNION ALL SELECT 'MANHUA (CN)', COUNT(*) FROM app.manhua UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels;"
} else {
    Write-Host "❌ Error en importación de manga" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "PASO 2: IMPORTAR ANIME (para encontrar donghua chinos)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
npm run import run -- -s anilist -t anime -l 1000

if ($LASTEXITCODE -eq 0) {
    $elapsed = (Get-Date) - $startTime
    Write-Host ""
    Write-Host "✅ Anime completado en $($elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📊 RESULTADOS ANIME:" -ForegroundColor Yellow
    psql -U postgres -d bd_chirisu -c "SELECT 'ANIME (JP)' as tipo, COUNT(*) FROM app.anime UNION ALL SELECT 'DONGHUA (CN)', COUNT(*) FROM app.donghua;"
} else {
    Write-Host "❌ Error en importación de anime" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✅ IMPORTACIÓN COMPLETA" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 RESUMEN FINAL:" -ForegroundColor Yellow
psql -U postgres -d bd_chirisu -c "
SELECT 'ANIME (JP)' as tipo, COUNT(*) as total FROM app.anime
UNION ALL SELECT 'DONGHUA (CN)', COUNT(*) FROM app.donghua
UNION ALL SELECT 'MANGA (JP)', COUNT(*) FROM app.manga
UNION ALL SELECT 'MANHWA (KR)', COUNT(*) FROM app.manhwa
UNION ALL SELECT 'MANHUA (CN)', COUNT(*) FROM app.manhua
UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels
UNION ALL SELECT '---', 0
UNION ALL SELECT 'TOTAL MEDIOS', 
    (SELECT COUNT(*) FROM app.anime) + 
    (SELECT COUNT(*) FROM app.donghua) + 
    (SELECT COUNT(*) FROM app.manga) + 
    (SELECT COUNT(*) FROM app.manhwa) + 
    (SELECT COUNT(*) FROM app.manhua) + 
    (SELECT COUNT(*) FROM app.novels)
ORDER BY tipo;
"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
