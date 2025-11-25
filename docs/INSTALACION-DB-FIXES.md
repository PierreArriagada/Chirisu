# 🚀 Instrucciones: Instalar Database Fixes & Triggers

## 📋 Pre-requisitos

- PostgreSQL 12+ instalado y corriendo
- Base de datos `bd_chirisu` creada
- Usuario con permisos de CREATE FUNCTION, CREATE TRIGGER
- Cliente PostgreSQL (elige uno):
  - **pgAdmin 4** (GUI)
  - **psql** (CLI)
  - **DBeaver** (GUI)
  - **VS Code extension** (SQLTools)

---

## 🔍 Paso 0: Verificar tablas necesarias (IMPORTANTE)

Antes de ejecutar el script principal, verificar que existen las tablas necesarias:

```sql
-- Ejecutar esta query en tu cliente PostgreSQL
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
  AND table_name IN (
    'user_contributions',
    'notifications',
    'content_reports',
    'anime',
    'users'
  )
ORDER BY table_name;
```

**Resultado esperado: 5 tablas**

### Si falta `content_reports`:

Ejecutar primero el script: `docs\CREATE-CONTENT-REPORTS.sql`

```powershell
# Con psql:
psql -U postgres -d bd_chirisu -f "docs\CREATE-CONTENT-REPORTS.sql"
```

O copiar/pegar en pgAdmin/DBeaver.

**Luego continuar con los pasos siguientes.**

---

## ⚡ Opción 1: Usar psql (Línea de comandos)

### Windows PowerShell:

```powershell
# Navegar a la carpeta del proyecto
cd "C:\Users\boris\OneDrive\Documentos\Chirisu"

# Ejecutar el script
psql -U postgres -d bd_chirisu -f "docs\DATABASE-FIXES-NOTIFICATIONS.sql"

# Si psql no está en PATH, usar ruta completa:
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d bd_chirisu -f "docs\DATABASE-FIXES-NOTIFICATIONS.sql"
```

**Resultado esperado:**
```
CREATE FUNCTION
CREATE TRIGGER
CREATE TRIGGER
CREATE TRIGGER
CREATE INDEX
...
✅ generate_slug existe
✅ trigger_notify_contribution_status_change existe
✅ trigger_notify_new_contribution existe
...
```

---

## 🖥️ Opción 2: Usar pgAdmin 4 (GUI)

1. **Abrir pgAdmin 4**
2. **Conectar al servidor PostgreSQL**
   - Servers → PostgreSQL → bd_chirisu
3. **Abrir Query Tool**
   - Click derecho en `bd_chirisu` → Query Tool
   - O presionar `Alt + Shift + Q`
4. **Cargar el script**
   - File → Open → Seleccionar `docs\DATABASE-FIXES-NOTIFICATIONS.sql`
   - O copiar y pegar todo el contenido
5. **Ejecutar**
   - Presionar `F5` o click en botón ▶️ Execute
6. **Verificar output**
   - Revisar pestaña "Messages" y "Data Output"
   - Debe mostrar "✅" en las verificaciones finales

---

## 🔍 Opción 3: Usar DBeaver (GUI)

1. **Abrir DBeaver**
2. **Conectar a bd_chirisu**
3. **Abrir SQL Editor**
   - Click derecho en `bd_chirisu` → SQL Editor → New SQL Script
   - O presionar `Ctrl + ]`
4. **Pegar el script**
   - Copiar todo el contenido de `docs\DATABASE-FIXES-NOTIFICATIONS.sql`
5. **Ejecutar**
   - Presionar `Ctrl + Enter` o click en ▶️ Execute
6. **Ver resultados**
   - Panel inferior muestra mensajes de éxito

---

## ✅ Verificación Post-Instalación

### 1. Verificar que las funciones existen:

```sql
-- En Query Tool / SQL Editor
SELECT proname, pronargs 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app' 
  AND proname IN (
    'generate_slug',
    'fn_notify_contribution_status_change',
    'fn_notify_new_contribution',
    'fn_notify_new_report',
    'fn_cleanup_old_notifications'
  );
```

**Resultado esperado: 5 filas**

### 2. Verificar que los triggers existen:

```sql
SELECT tgname, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname LIKE 'trigger_notify%' OR tgname LIKE 'auto_generate_slug%';
```

**Resultado esperado: 4+ filas**

### 3. Verificar índices:

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'app' 
  AND indexname LIKE 'idx_notifications_%';
```

**Resultado esperado: 3 filas**

---

## 🔧 Siguiente paso: Reiniciar servidor Next.js

Una vez ejecutado el script exitosamente:

```powershell
# En la terminal de VS Code
# Detener servidor actual (Ctrl + C)
# Luego:
npm run dev
```

---

## 🧪 Prueba rápida de funcionamiento

### A. Probar generate_slug()

```sql
-- Debe devolver: "dragon-ball-z-1"
SELECT app.generate_slug('Dragon Ball Z', 1);

-- Debe devolver: "one-piece-café-42"
SELECT app.generate_slug('One Piece & Café!', 42);
```

### B. Probar notificaciones automáticas

**Simulación de nueva contribución:**

```sql
-- Insertar contribución de prueba
INSERT INTO app.user_contributions (
  user_id, 
  contributable_type, 
  contribution_data, 
  status
) VALUES (
  1, -- ID de tu usuario
  'anime',
  '{"title":"Test Anime"}'::jsonb,
  'pending'
);

-- Verificar que se crearon notificaciones automáticamente
SELECT * FROM app.notifications 
WHERE action_type = 'contribution_submitted' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado esperado:**
- Al menos 1 notificación para cada admin/moderador
- `notifiable_type = 'contribution'`
- `read_at IS NULL`

### C. Probar aprobación automática

```sql
-- Cambiar status a 'approved'
UPDATE app.user_contributions 
SET status = 'approved',
    reviewed_by = 1, -- ID del moderador
    reviewed_at = NOW()
WHERE id = (SELECT MAX(id) FROM app.user_contributions);

-- Verificar notificación al usuario original
SELECT * FROM app.notifications 
WHERE action_type = 'contribution_approved' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🐛 Troubleshooting

### Error: "permission denied for schema app"

**Solución:**
```sql
GRANT ALL ON SCHEMA app TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA app TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO postgres;
```

### Error: "function generate_slug already exists"

**Solución:**
- Esto es normal si ejecutas el script dos veces
- El script usa `CREATE OR REPLACE` así que no debería fallar
- Si falla, ejecuta manualmente:
```sql
DROP FUNCTION IF EXISTS app.generate_slug(TEXT, BIGINT) CASCADE;
-- Luego ejecuta el script completo de nuevo
```

### Error: "relation does not exist"

**Problema:** Alguna tabla no existe
**Solución:**
```sql
-- Verificar que existan las tablas necesarias
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
  AND table_name IN (
    'user_contributions',
    'notifications',
    'content_reports',
    'anime'
  );
```
Si falta alguna, debes crearla primero.

### Los triggers no se ejecutan

**Verificar que están habilitados:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'trigger_notify%';
```

**Si `tgenabled = 'D'` (disabled), habilitar:**
```sql
ALTER TABLE app.user_contributions 
ENABLE TRIGGER trigger_notify_contribution_status_change;

ALTER TABLE app.user_contributions 
ENABLE TRIGGER trigger_notify_new_contribution;

ALTER TABLE app.content_reports 
ENABLE TRIGGER trigger_notify_new_report;
```

---

## 📊 Monitoreo de logs (opcional)

Para ver los mensajes RAISE NOTICE de los triggers:

### En psql:
```sql
\set VERBOSITY verbose
-- Ahora ejecuta operaciones y verás los mensajes
```

### En pgAdmin:
- File → Preferences → Query Tool → Results
- Marcar: "Show all messages from the backend"

### En DBeaver:
- Window → Preferences → Editors → SQL Editor
- Marcar: "Show server output"

Luego al ejecutar INSERT/UPDATE verás mensajes como:
```
NOTICE: 🔔 Notificación creada: Contribución 42 aprobada
NOTICE: 🔔 Notificaciones creadas: Nueva contribución 42 enviada por usuario 5
```

---

## 🎯 Checklist Final

Antes de continuar con pruebas en la aplicación:

- [ ] Script ejecutado sin errores
- [ ] 5 funciones creadas (verificación SQL pasó)
- [ ] 3+ triggers creados (verificación SQL pasó)
- [ ] 3 índices creados (verificación SQL pasó)
- [ ] `generate_slug()` funciona (prueba manual pasó)
- [ ] Notificaciones automáticas funcionan (prueba manual pasó)
- [ ] Servidor Next.js reiniciado

**¡Listo para probar la aplicación! 🚀**

---

## 📚 Documentación relacionada

- [DATABASE-FIXES-NOTIFICATIONS.sql](./DATABASE-FIXES-NOTIFICATIONS.sql) - Script completo
- [blueprint.md](./blueprint.md) - Arquitectura del sistema
- PostgreSQL Triggers: https://www.postgresql.org/docs/current/plpgsql-trigger.html
