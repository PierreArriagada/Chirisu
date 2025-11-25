# ============================================================================
# SCRIPT SIMPLE: Importación masiva de todos los tipos
# ============================================================================
# Importa anime y manga con límite alto
# El sistema automáticamente separa en las tablas correctas según país/formato
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando importación masiva..." -ForegroundColor Cyan
Write-Host ""

# ANIME (incluye automáticamente donghua si es de China)
Write-Host "📺 Importando ANIME + DONGHUA..." -ForegroundColor Yellow
npm run import run -- -s anilist -t anime -l 500

Write-Host ""
Write-Host "📚 Importando MANGA + MANHWA + MANHUA + NOVELS..." -ForegroundColor Yellow
npm run import run -- -s anilist -t manga -l 500

Write-Host ""
Write-Host "✅ Importación completada!" -ForegroundColor Green
Write-Host ""

# Mostrar resultados
Write-Host "📊 RESULTADOS:" -ForegroundColor Cyan
psql -U postgres -d bd_chirisu -c "
    SELECT 'ANIME' as tipo, COUNT(*) as total FROM app.anime
    UNION ALL SELECT 'MANGA', COUNT(*) FROM app.manga
    UNION ALL SELECT 'MANHWA', COUNT(*) FROM app.manhwa
    UNION ALL SELECT 'MANHUA', COUNT(*) FROM app.manhua
    UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels
    UNION ALL SELECT 'DONGHUA', COUNT(*) FROM app.donghua
    UNION ALL SELECT '---', 0
    UNION ALL SELECT 'PERSONAJES', COUNT(*) FROM app.characters
    UNION ALL SELECT 'ACTORES', COUNT(*) FROM app.voice_actors
    UNION ALL SELECT 'STAFF', COUNT(*) FROM app.staff
    ORDER BY tipo;
"
