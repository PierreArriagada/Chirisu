# ============================================================================
# SCRIPT: Limpiar base de datos manteniendo SOLO usuarios
# ============================================================================
# DESCRIPCIÓN: Ejecuta el script SQL para eliminar TODO excepto usuarios y roles
# ADVERTENCIA: Esta acción es IRREVERSIBLE
# ============================================================================

$ErrorActionPreference = "Stop"

# Configuración
$DB_NAME = "bd_chirisu"
$DB_USER = "postgres"
$SCRIPT_PATH = "scripts/database/reset-database-keep-users.sql"
$BACKUP_PATH = "backups/backup-before-reset-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA DE BASE DE DATOS - MANTENER SOLO USUARIOS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el script SQL existe
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "❌ ERROR: No se encontró el script SQL en: $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "📋 INFORMACIÓN:" -ForegroundColor Yellow
Write-Host "   Base de datos: $DB_NAME" -ForegroundColor White
Write-Host "   Usuario: $DB_USER" -ForegroundColor White
Write-Host "   Script: $SCRIPT_PATH" -ForegroundColor White
Write-Host ""

# Mostrar estadísticas actuales
Write-Host "📊 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS:" -ForegroundColor Cyan
Write-Host ""

psql -U $DB_USER -d $DB_NAME -c "
    SELECT 'USUARIOS' as tabla, COUNT(*) as total FROM app.users
    UNION ALL SELECT 'ANIME', COUNT(*) FROM app.anime
    UNION ALL SELECT 'MANGA', COUNT(*) FROM app.manga
    UNION ALL SELECT 'MANHWA', COUNT(*) FROM app.manhwa
    UNION ALL SELECT 'MANHUA', COUNT(*) FROM app.manhua
    UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels
    UNION ALL SELECT 'DONGHUA', COUNT(*) FROM app.donghua
    UNION ALL SELECT 'FAN COMICS', COUNT(*) FROM app.fan_comics
    UNION ALL SELECT 'PERSONAJES', COUNT(*) FROM app.characters
    UNION ALL SELECT 'ACTORES DE VOZ', COUNT(*) FROM app.voice_actors
    UNION ALL SELECT 'STAFF', COUNT(*) FROM app.staff
    UNION ALL SELECT 'STUDIOS', COUNT(*) FROM app.studios
    UNION ALL SELECT 'REVIEWS', COUNT(*) FROM app.reviews
    UNION ALL SELECT 'COMENTARIOS', COUNT(*) FROM app.comments
    UNION ALL SELECT 'LISTAS', COUNT(*) FROM app.lists
    ORDER BY tabla;
"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "⚠️  ADVERTENCIA" -ForegroundColor Red
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script eliminará PERMANENTEMENTE:" -ForegroundColor Yellow
Write-Host "  ❌ Todos los anime, manga, manhwa, manhua, novels, donghua y fan comics" -ForegroundColor Red
Write-Host "  ❌ Todos los personajes, actores de voz y staff" -ForegroundColor Red
Write-Host "  ❌ Todos los studios y géneros" -ForegroundColor Red
Write-Host "  ❌ Todas las reviews, comentarios y listas de usuarios" -ForegroundColor Red
Write-Host "  ❌ Todas las relaciones entre medios" -ForegroundColor Red
Write-Host "  ❌ Todos los episodios y trailers" -ForegroundColor Red
Write-Host ""
Write-Host "Se PRESERVARÁN:" -ForegroundColor Green
Write-Host "  ✅ Usuarios (users)" -ForegroundColor Green
Write-Host "  ✅ Roles y permisos (roles, permissions, role_permissions, user_roles)" -ForegroundColor Green
Write-Host "  ✅ Estados de medios (media_statuses)" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Confirmación del usuario
$confirmation = Read-Host "¿Estás ABSOLUTAMENTE SEGURO de que quieres continuar? (escribe 'SI ELIMINAR' para confirmar)"

if ($confirmation -ne "SI ELIMINAR") {
    Write-Host ""
    Write-Host "❌ Operación cancelada por el usuario." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "PASO 1: Creando backup de seguridad..." -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de backups si no existe
$backupDir = Split-Path -Parent $BACKUP_PATH
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Crear backup
Write-Host "📦 Creando backup en: $BACKUP_PATH" -ForegroundColor Cyan
pg_dump -U $DB_USER -d $DB_NAME -F p -f $BACKUP_PATH

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup creado exitosamente" -ForegroundColor Green
    $backupSize = (Get-Item $BACKUP_PATH).Length / 1MB
    Write-Host "   Tamaño: $([math]::Round($backupSize, 2)) MB" -ForegroundColor White
} else {
    Write-Host "❌ Error al crear backup" -ForegroundColor Red
    Write-Host "⚠️  Se recomienda crear un backup manual antes de continuar" -ForegroundColor Yellow
    Write-Host ""
    $continueWithoutBackup = Read-Host "¿Continuar SIN backup? (y/N)"
    if ($continueWithoutBackup -ne "y") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "PASO 2: Ejecutando script de limpieza..." -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar script SQL
psql -U $DB_USER -d $DB_NAME -f $SCRIPT_PATH

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "✅ LIMPIEZA COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Backup guardado en: $BACKUP_PATH" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "La base de datos está lista para una importación fresca." -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "❌ ERROR EN LA LIMPIEZA" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Puede restaurar desde el backup con:" -ForegroundColor Yellow
    Write-Host "   psql -U $DB_USER -d $DB_NAME -f $BACKUP_PATH" -ForegroundColor White
    Write-Host ""
    exit 1
}
