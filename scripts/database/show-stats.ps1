# ============================================================================
# SCRIPT: Ver estado actual de la base de datos
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "ESTADO ACTUAL DE LA BASE DE DATOS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar query simple
psql -U postgres -d bd_chirisu -c @"
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
UNION ALL SELECT 'STUDIOS', COUNT(*) FROM app.studios
UNION ALL SELECT 'RELACIONES', COUNT(*) FROM app.media_relations
ORDER BY tipo;
"@

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
