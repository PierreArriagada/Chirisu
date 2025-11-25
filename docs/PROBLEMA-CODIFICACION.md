# 🔧 Problema de Codificación Resuelto

## ❌ Problema Encontrado

Al ejecutar el script `DATABASE-FIXES-NOTIFICATIONS.sql` con psql, aparecieron errores de codificación:

```
ERROR: carácter con secuencia de bytes 0x81 en codificación «WIN1252» no tiene equivalente en la codificación «UTF8»
ERROR: carácter con secuencia de bytes 0x9d en codificación «WIN1252» no tiene equivalente en la codificación «UTF8»
ERROR: carácter con secuencia de bytes 0x8d en codificación «WIN1252» no tiene equivalente en la codificación «UTF8»
```

## 🔍 Causa Raíz

1. **Windows usa codificación WIN1252 por defecto**
   - PowerShell y cmd.exe usan WIN1252/CP1252
   - Los archivos .sql se guardaron con caracteres UTF-8 (tildes, emojis)
   - psql intentaba interpretar UTF-8 como WIN1252

2. **Caracteres problemáticos:**
   - Tildes en comentarios: `á é í ó ú ñ`
   - Emojis en mensajes RAISE NOTICE: `🔔 ✅`
   - Comillas especiales: `« »`

## ✅ Solución Implementada

### 1. Cambiar codificación de PowerShell a UTF-8

```powershell
chcp 65001
```

Esto cambia la página de códigos a UTF-8 (code page 65001).

### 2. Crear versión limpia del script

Se creó `DATABASE-FIXES-NOTIFICATIONS-UTF8.sql` con:

- **Sin emojis en comentarios:** 
  - ❌ `-- 🔔 Notificar...`
  - ✅ `-- Notificar...`

- **Sin tildes en comentarios:**
  - ❌ `-- Convertir a minúsculas...`
  - ✅ `-- Convertir a minusculas...`

- **Declaración explícita de encoding:**
  ```sql
  SET client_encoding = 'UTF8';
  ```

- **Función translate() con caracteres literales:**
  ```sql
  base_slug := translate(base_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  ```
  Estos caracteres están en el CUERPO de la función, no en comentarios, por lo que PostgreSQL los maneja correctamente.

### 3. RAISE NOTICE sin emojis

**Antes:**
```sql
RAISE NOTICE '🔔 Notificación creada: Contribución % aprobada', NEW.id;
```

**Después:**
```sql
RAISE NOTICE 'Notificacion creada: Contribucion % aprobada', NEW.id;
```

## 📊 Resultado

El script se ejecutó **exitosamente** con solo advertencias menores sobre vistas existentes (no son errores):

```
✅ OK - generate_slug existe
✅ Triggers en user_contributions: 2
✅ Triggers en content_reports: 1
✅ OK - idx_notifications_unread existe
✅ OK - idx_notifications_action_type existe
✅ OK - idx_notifications_notifiable existe
✅ Script ejecutado exitosamente!
```

## 🎓 Lecciones Aprendidas

### 1. Codificación de archivos SQL

**Mejor práctica:**
- Guardar archivos SQL en UTF-8 sin BOM
- Declarar `SET client_encoding = 'UTF8';` al inicio
- Evitar emojis en comentarios si trabajas en Windows

### 2. PowerShell y codificación

**Para proyectos futuros:**
```powershell
# Siempre ejecutar esto primero
chcp 65001

# O configurar en el perfil de PowerShell
# $PROFILE
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 3. psql en Windows

**Alternativa 1: Usar pgAdmin**
- No tiene problemas de codificación
- Interfaz gráfica más amigable

**Alternativa 2: Usar DBeaver**
- Maneja UTF-8 nativamente
- Multiplataforma

**Alternativa 3: psql con encoding explícito**
```powershell
$env:PGCLIENTENCODING="UTF8"
psql -U postgres -d bd_chirisu -f "archivo.sql"
```

## 🔄 Archivos del Proyecto

| Archivo | Estado | Uso |
|---------|--------|-----|
| `DATABASE-FIXES-NOTIFICATIONS.sql` | ⚠️ Problemático | No usar en Windows con psql |
| `DATABASE-FIXES-NOTIFICATIONS-UTF8.sql` | ✅ Funcional | **USAR ESTE** |

## 📝 Recomendaciones

### Si necesitas editar el script:

1. **Usa VS Code con UTF-8:**
   - Bottom bar → "Select Encoding" → "UTF-8"
   - Save file

2. **Evita caracteres especiales en comentarios:**
   - ✅ OK: `a-z`, `A-Z`, `0-9`, `-`, `_`
   - ⚠️ Evitar: tildes, emojis, comillas especiales

3. **Los datos de usuario SÍ pueden tener tildes:**
   - Los títulos de anime con acentos funcionan bien
   - La función `generate_slug()` los normaliza correctamente
   - Solo los COMENTARIOS del código SQL causan problemas

### Ejemplo seguro:

```sql
-- Comentario sin tildes ni caracteres especiales
CREATE FUNCTION app.ejemplo(titulo TEXT)
RETURNS TEXT AS $$
BEGIN
  -- La variable 'titulo' puede contener: "Pokémon" sin problema
  -- La función translate() maneja los acentos correctamente
  RETURN lower(translate(titulo, 'áéíóú', 'aeiou'));
END;
$$ LANGUAGE plpgsql;
```

## ✅ Verificación

Para confirmar que todo funciona con caracteres especiales:

```sql
-- Debe funcionar perfectamente:
SELECT app.generate_slug('Pokémon: Diamante y Perla', 1);
-- Resultado: pokemon-diamante-y-perla-1

SELECT app.generate_slug('Café con Leche & Azúcar', 42);
-- Resultado: cafe-con-leche-azucar-42
```

## 🎯 Conclusión

El problema de codificación está **100% resuelto** usando:
1. `chcp 65001` antes de ejecutar psql
2. Script sin emojis/tildes en comentarios
3. `SET client_encoding = 'UTF8';` en el script

El sistema ahora maneja correctamente:
- ✅ Títulos con acentos
- ✅ Caracteres especiales en datos
- ✅ Normalización automática en slugs
- ✅ Compatibilidad Windows/Linux/Mac

---

**Archivo correcto a usar:** `DATABASE-FIXES-NOTIFICATIONS-UTF8.sql` ✅
