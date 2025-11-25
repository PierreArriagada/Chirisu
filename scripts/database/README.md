# Scripts de Base de Datos

Este directorio contiene scripts para gestionar la base de datos PostgreSQL de Chirisu.

## 📁 Archivos

### `reset-database-keep-users.sql`
Script SQL que elimina **TODO** el contenido de la base de datos **EXCEPTO**:
- ✅ Usuarios (`users`)
- ✅ Roles (`roles`)
- ✅ Permisos (`permissions`)
- ✅ Relaciones roles-permisos (`role_permissions`)
- ✅ Roles asignados a usuarios (`user_roles`)
- ✅ Estados de medios (`media_statuses`)

**Elimina:**
- ❌ Todos los medios (anime, manga, manhwa, manhua, novels, donghua, fan comics)
- ❌ Todos los personajes, actores de voz y staff
- ❌ Todos los studios, géneros y tags
- ❌ Todas las reviews, comentarios y listas de usuarios
- ❌ Todas las relaciones entre medios
- ❌ Todos los episodios, trailers y enlaces externos
- ❌ Todo el contenido generado por usuarios (contribuciones, favoritos, etc.)

**Además:**
- 🔄 Resetea todas las secuencias de IDs a 1
- 📊 Muestra estadísticas antes y después de la limpieza
- ✅ Verifica la integridad de los datos preservados

---

### `reset-database.ps1`
Script de PowerShell con **SEGURIDAD MÁXIMA** que:
1. ✅ Muestra estadísticas actuales
2. ✅ Pide confirmación explícita (debes escribir "SI ELIMINAR")
3. ✅ **Crea un backup automático** antes de ejecutar
4. ✅ Ejecuta el script SQL de limpieza
5. ✅ Muestra resumen final

**Uso:**
```powershell
.\scripts\database\reset-database.ps1
```

**Características:**
- 🔒 Requiere confirmación explícita
- 💾 Crea backup automático en `backups/backup-before-reset-YYYY-MM-DD-HHmmss.sql`
- 📊 Muestra estadísticas detalladas
- ⚠️ Permite cancelar en cualquier momento

---

### `reset-database-quick.ps1`
Script de PowerShell **RÁPIDO** que ejecuta la limpieza directamente:
- ⚡ **NO pide confirmación**
- ⚡ **NO crea backup**
- ⚡ Solo para uso en desarrollo cuando estás 100% seguro

**Uso:**
```powershell
.\scripts\database\reset-database-quick.ps1
```

⚠️ **ADVERTENCIA:** Usar solo cuando estés absolutamente seguro. No hay vuelta atrás.

---

## 🚀 Casos de Uso

### Caso 1: Limpiar base de datos de forma segura (RECOMENDADO)
```powershell
# Ejecutar con confirmación y backup automático
.\scripts\database\reset-database.ps1
```

### Caso 2: Limpiar base de datos rápidamente (desarrollo)
```powershell
# Ejecución directa sin confirmación ni backup
.\scripts\database\reset-database-quick.ps1
```

### Caso 3: Ejecutar SQL directamente (máximo control)
```powershell
# Crear backup manual primero
pg_dump -U postgres -d bd_chirisu -F p -f backup.sql

# Ejecutar script SQL
psql -U postgres -d bd_chirisu -f scripts/database/reset-database-keep-users.sql
```

### Caso 4: Restaurar desde backup
```powershell
# Restaurar desde un backup previo
psql -U postgres -d bd_chirisu -f backups/backup-before-reset-2025-11-04-123456.sql
```

---

## 📋 Flujo Típico de Limpieza + Importación

```powershell
# 1. Limpiar base de datos (mantiene usuarios)
.\scripts\database\reset-database.ps1

# 2. Importar datos frescos desde AniList
cd scripts/import
npm run import run -- -s anilist -t anime -l 100
npm run import run -- -s anilist -t manga -l 100
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ NO USAR EN PRODUCCIÓN
Estos scripts están diseñados para **DESARROLLO**. En producción:
- Usa migrations controladas
- Haz backups completos antes de cualquier cambio
- Prueba en un entorno de staging primero

### 💾 Siempre haz Backup
Aunque `reset-database.ps1` crea backups automáticos, considera hacer backups manuales adicionales de datos críticos.

### 🔐 Usuarios Preservados
Los scripts preservan **TODOS** los usuarios y sus roles. Si quieres eliminar también los usuarios:
1. Edita `reset-database-keep-users.sql`
2. Agrega `TRUNCATE TABLE app.users CASCADE;`
3. Ten MUCHO cuidado - ¡perderás todos los usuarios!

---

## 📊 Tablas Preservadas

| Tabla | Descripción | Preservada |
|-------|-------------|------------|
| `users` | Usuarios del sistema | ✅ SÍ |
| `roles` | Roles (admin, moderator, user) | ✅ SÍ |
| `permissions` | Permisos del sistema | ✅ SÍ |
| `role_permissions` | Relación roles-permisos | ✅ SÍ |
| `user_roles` | Roles asignados a usuarios | ✅ SÍ |
| `media_statuses` | Estados de medios (airing, finished, etc.) | ✅ SÍ |

## 📊 Tablas Eliminadas

| Categoría | Tablas |
|-----------|--------|
| **Medios** | `anime`, `manga`, `manhwa`, `manhua`, `novels`, `donghua`, `fan_comic`, `fan_comics` |
| **Personas** | `characters`, `voice_actors`, `staff` |
| **Organizaciones** | `studios` |
| **Contenido** | `episodes`, `alternative_titles`, `external_links`, `media_trailers` |
| **Relaciones** | `media_relations`, `media_genres`, `characterable_characters`, `character_voice_actors`, `staffable_staff`, `studiable_studios`, `taggable_tags` |
| **Usuario-Contenido** | `reviews`, `comments`, `comment_reactions`, `lists`, `list_items`, `user_favorites`, `notifications`, `trailer_views` |
| **Sistema** | `genres`, `tags`, `rankings_cache`, `audit_log`, `content_contributions`, `content_reports`, `action_points` |

---

## 🔧 Requisitos

- PostgreSQL 12+
- PowerShell 5.1+ (Windows) o PowerShell Core (cross-platform)
- Usuario `postgres` con permisos completos en `bd_chirisu`
- Conexión local a PostgreSQL (localhost:5432)

---

## 📝 Notas Técnicas

### Orden de Eliminación
El script respeta el orden de dependencias de foreign keys:
1. Primero elimina datos de usuarios relacionados con contenido
2. Luego elimina relaciones entre entidades
3. Después elimina el contenido de medios
4. Finalmente elimina las entidades base (personajes, staff, etc.)

### Transacciones
Todo el script se ejecuta en una **transacción única** (`BEGIN`...`COMMIT`):
- Si algo falla, se hace **ROLLBACK automático**
- La base de datos queda en estado consistente

### Secuencias Reseteadas
Todas las secuencias de IDs se resetean a 1:
```sql
ALTER SEQUENCE app.anime_id_seq RESTART WITH 1;
ALTER SEQUENCE app.characters_id_seq RESTART WITH 1;
-- ... etc
```

Esto significa que los nuevos registros empezarán con `id = 1`.

---

## 🆘 Solución de Problemas

### Error: "no existe la relación"
**Causa:** Una tabla fue eliminada manualmente.  
**Solución:** Comenta esa línea en el SQL o restaura el schema completo.

### Error: "permiso denegado"
**Causa:** Usuario sin permisos suficientes.  
**Solución:** Usa el usuario `postgres` o un superusuario.

### Script se queda esperando
**Causa:** Transacción bloqueada por otra conexión.  
**Solución:** 
```sql
-- Ver conexiones activas
SELECT * FROM pg_stat_activity WHERE datname = 'bd_chirisu';

-- Terminar conexiones si es necesario
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'bd_chirisu' AND pid <> pg_backend_pid();
```

---

## 📚 Referencias

- [PostgreSQL TRUNCATE Documentation](https://www.postgresql.org/docs/current/sql-truncate.html)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
