# ============================================================================
# SCRIPT RÁPIDO: Limpiar base de datos (SIN confirmación ni backup)
# ============================================================================
# ADVERTENCIA: Este script NO crea backup y NO pide confirmación
# Usar SOLO en desarrollo cuando estés seguro de lo que haces
# ============================================================================

$ErrorActionPreference = "Stop"

$DB_NAME = "bd_chirisu"
$DB_USER = "postgres"
$SCRIPT_PATH = "scripts/database/reset-database-keep-users.sql"

Write-Host "🗑️  Limpiando base de datos (manteniendo usuarios)..." -ForegroundColor Yellow

psql -U $DB_USER -d $DB_NAME -f $SCRIPT_PATH

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos limpiada exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al limpiar la base de datos" -ForegroundColor Red
    exit 1
}
