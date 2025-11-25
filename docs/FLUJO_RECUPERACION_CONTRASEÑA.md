# 🔐 Flujo de Recuperación de Contraseña

**Última actualización**: 8 de Noviembre, 2025

## 📋 Resumen

Sistema de recuperación de contraseña que usa:
- ✅ **Recovery Code** único (64 caracteres hex) - almacenado en `app.recovery_codes`
- ✅ **Código A2F** de 6 dígitos (TOTP) - generado por Google Authenticator/Authy
- ✅ **Códigos de Respaldo** (backup codes) - almacenados hasheados en `app.user_2fa.backup_codes`

## 🗄️ Estructura de Base de Datos

### Tabla: `app.recovery_codes`

```sql
CREATE TABLE app.recovery_codes (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    code             VARCHAR(64) NOT NULL UNIQUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_regenerated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Características**:
- Un recovery code por usuario (relación 1:1)
- Se regenera automáticamente después de cada uso
- 64 caracteres hexadecimales (256 bits de entropía)

### Tabla: `app.user_2fa`

```sql
CREATE TABLE app.user_2fa (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    secret        VARCHAR(255) NOT NULL,
    enabled       BOOLEAN DEFAULT TRUE,
    backup_codes  TEXT[],  -- Array de códigos hasheados con SHA256
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled_at    TIMESTAMP,
    recovery_code VARCHAR(64)  -- ⚠️ DEPRECADO - No usar, usar app.recovery_codes
);
```

**Nota importante**: La columna `recovery_code` en `user_2fa` está deprecada. Usar siempre `app.recovery_codes`.

## 🔄 Flujo Completo

### 1️⃣ Registro de Usuario

```typescript
// POST /api/auth/register
{
  username: "usuario123",
  email: "usuario@ejemplo.com",
  password: "MiPassword123"
}
```

**Lo que sucede**:

1. Se crea el usuario en `app.users` con `password_hash`
2. Se asigna el rol 'user' en `app.user_roles`
3. Se genera secret TOTP y 10 backup codes
4. Se insertan en `app.user_2fa`:
   ```sql
   INSERT INTO app.user_2fa (user_id, secret, enabled, backup_codes)
   VALUES (123, 'SECRET_BASE32', false, ARRAY['hash1', 'hash2', ...])
   ```
5. Se genera recovery code único (64 chars hex)
6. Se inserta en `app.recovery_codes`:
   ```sql
   INSERT INTO app.recovery_codes (user_id, code, created_at)
   VALUES (123, 'a1b2c3d4...64chars', NOW())
   ```
7. Se crean 4 listas predeterminadas

**Respuesta**:
```json
{
  "success": true,
  "message": "Usuario registrado. Verifica tu código A2F.",
  "username": "usuario123",
  "qrCode": "data:image/png;base64,...",
  "manualCode": "SECRET_BASE32",
  "backupCodes": [
    "ABC123DEF",
    "GHI456JKL",
    ...
  ],
  "recoveryCode": "a1b2c3d4e5f6...64chars"
}
```

### 2️⃣ Recuperación de Contraseña

**Endpoint**: `POST /api/auth/recover-password`

```typescript
{
  recoveryCode: "a1b2c3d4e5f6...64chars",
  twoFactorCode: "123456",  // O código de respaldo
  newPassword: "NuevaPassword123"
}
```

**Validaciones**:

```typescript
// 1. Recovery code formato
if (!/^[a-f0-9]{64}$/i.test(recoveryCode)) {
  return { error: 'Recovery code inválido' };
}

// 2. Nueva contraseña requisitos
if (newPassword.length < 8) {
  return { error: 'Mínimo 8 caracteres' };
}
if (!/[A-Z]/.test(newPassword)) {
  return { error: 'Incluir mayúscula' };
}
if (!/[a-z]/.test(newPassword)) {
  return { error: 'Incluir minúscula' };
}
if (!/[0-9]/.test(newPassword)) {
  return { error: 'Incluir número' };
}
```

**Proceso**:

```sql
-- 1. Buscar usuario por recovery code
SELECT rc.user_id, u.email, u.username, u.is_active, u.deleted_at
FROM app.recovery_codes rc
JOIN app.users u ON u.id = rc.user_id
WHERE rc.code = 'a1b2c3d4...';

-- 2. Verificar que esté activo
IF NOT is_active OR deleted_at IS NOT NULL THEN
  RETURN { error: 'Cuenta desactivada' };
END IF;

-- 3. Obtener configuración 2FA
SELECT secret, enabled, backup_codes
FROM app.user_2fa
WHERE user_id = 123;

-- 4. Verificar código A2F
-- Opción A: Código TOTP (6 dígitos)
IF twoFactorCode.match(/^\d{6}$/) THEN
  verification = verifyToken(secret, twoFactorCode);
END IF;

-- Opción B: Código de respaldo (si TOTP falló)
IF NOT verification.valid AND backup_codes.length > 0 THEN
  verification = verifyHashedBackupCode(backup_codes, twoFactorCode);
  
  IF verification.valid THEN
    -- Eliminar código usado
    UPDATE app.user_2fa 
    SET backup_codes = remainingCodes
    WHERE user_id = 123;
  END IF;
END IF;

-- 5. Si código válido, actualizar contraseña
UPDATE app.users
SET password_hash = 'NUEVO_HASH', updated_at = NOW()
WHERE id = 123;

-- 6. Regenerar recovery code
UPDATE app.recovery_codes
SET code = 'NUEVO_64_CHARS', last_regenerated = NOW()
WHERE user_id = 123;
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "newRecoveryCode": "xyz789abc123...64chars",
  "username": "usuario123",
  "email": "usuario@ejemplo.com",
  "usedBackupCode": false,
  "backupCodesRemaining": undefined
}
```

**Respuesta con backup code usado**:

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "newRecoveryCode": "xyz789abc123...64chars",
  "username": "usuario123",
  "email": "usuario@ejemplo.com",
  "usedBackupCode": true,
  "backupCodesRemaining": 7
}
```

## 🧪 Casos de Prueba

### Test 1: Recuperación con código TOTP

```bash
# 1. Obtener recovery code del usuario
psql -U postgres -d bd_chirisu -c "
  SELECT rc.code 
  FROM app.recovery_codes rc
  JOIN app.users u ON u.id = rc.user_id
  WHERE u.username = 'testuser';
"

# 2. Generar código TOTP desde Google Authenticator

# 3. Hacer request
curl -X POST http://localhost:3000/api/auth/recover-password \
  -H "Content-Type: application/json" \
  -d '{
    "recoveryCode": "a1b2c3d4...",
    "twoFactorCode": "123456",
    "newPassword": "NewPassword123"
  }'

# ✅ Esperado: { success: true, newRecoveryCode: "..." }
```

### Test 2: Recuperación con backup code

```bash
# 1. Obtener recovery code
# 2. Usar uno de los backup codes guardados

curl -X POST http://localhost:3000/api/auth/recover-password \
  -H "Content-Type: application/json" \
  -d '{
    "recoveryCode": "a1b2c3d4...",
    "twoFactorCode": "ABC123DEF",
    "newPassword": "NewPassword123"
  }'

# ✅ Esperado: { success: true, usedBackupCode: true, backupCodesRemaining: 9 }
```

### Test 3: Recovery code inválido

```bash
curl -X POST http://localhost:3000/api/auth/recover-password \
  -H "Content-Type: application/json" \
  -d '{
    "recoveryCode": "codigo_invalido",
    "twoFactorCode": "123456",
    "newPassword": "NewPassword123"
  }'

# ✅ Esperado: { error: "Recovery code inválido" }
```

### Test 4: Código A2F inválido

```bash
curl -X POST http://localhost:3000/api/auth/recover-password \
  -H "Content-Type: application/json" \
  -d '{
    "recoveryCode": "a1b2c3d4...",
    "twoFactorCode": "999999",
    "newPassword": "NewPassword123"
  }'

# ✅ Esperado: { error: "Código A2F o código de respaldo inválido" }
```

### Test 5: Contraseña débil

```bash
curl -X POST http://localhost:3000/api/auth/recover-password \
  -H "Content-Type: application/json" \
  -d '{
    "recoveryCode": "a1b2c3d4...",
    "twoFactorCode": "123456",
    "newPassword": "abc"
  }'

# ✅ Esperado: { error: "La contraseña debe tener al menos 8 caracteres" }
```

## 🔍 Verificación de Integridad

### Consulta 1: Ver recovery codes de todos los usuarios

```sql
SELECT 
  u.id,
  u.username,
  u.email,
  rc.code,
  rc.created_at,
  rc.last_regenerated,
  CASE 
    WHEN rc.last_regenerated > rc.created_at THEN 'Regenerado'
    ELSE 'Original'
  END as status
FROM app.users u
LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
WHERE u.is_active = true AND u.deleted_at IS NULL
ORDER BY u.id;
```

### Consulta 2: Ver estado de backup codes

```sql
SELECT 
  u.id,
  u.username,
  u2f.enabled as a2f_enabled,
  COALESCE(array_length(u2f.backup_codes, 1), 0) as backup_codes_count,
  CASE
    WHEN array_length(u2f.backup_codes, 1) = 0 THEN '⚠️ Sin códigos'
    WHEN array_length(u2f.backup_codes, 1) < 3 THEN '⚠️ Pocos códigos'
    ELSE '✅ OK'
  END as status
FROM app.users u
JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.is_active = true
ORDER BY backup_codes_count ASC;
```

### Consulta 3: Auditoría de cambios de contraseña

```sql
-- Si existe la tabla audit_log
SELECT 
  u.username,
  al.action,
  al.details,
  al.created_at
FROM app.audit_log al
JOIN app.users u ON u.id = al.user_id
WHERE al.action = 'password_reset'
ORDER BY al.created_at DESC
LIMIT 50;
```

## 🛡️ Seguridad

### Características de Seguridad

1. **Recovery Code Único**:
   - 64 caracteres hexadecimales
   - 256 bits de entropía
   - Se regenera después de cada uso
   - Un código por usuario

2. **Verificación 2FA**:
   - TOTP de 6 dígitos (30 segundos de ventana)
   - Backup codes hasheados con SHA256
   - Códigos de respaldo son de un solo uso

3. **Contraseñas**:
   - Hasheadas con bcrypt (10 rounds)
   - Requisitos: 8+ chars, mayúsculas, minúsculas, números
   - No se reutiliza hash anterior

4. **Protecciones**:
   - Verifica que cuenta esté activa
   - Verifica que no esté eliminada
   - Rate limiting recomendado (TODO)

### Recomendaciones Adicionales

```typescript
// TODO: Implementar rate limiting
// Máximo 5 intentos por IP cada 15 minutos
// Máximo 3 intentos por recovery code cada hora

// TODO: Notificación por email cuando se disponibilice
// Enviar email cuando se cambie contraseña

// TODO: Logs de seguridad
// Registrar todos los intentos (exitosos y fallidos)
```

## 📝 Notas Importantes

1. **Tabla deprecada**: `app.user_2fa.recovery_code` no se usa. Solo `app.recovery_codes`.

2. **Backup codes**: Se almacenan como array de strings hasheados con SHA256, NO bcrypt.

3. **Recovery code regeneración**: Siempre se regenera después de usarse, por seguridad.

4. **Diferencia entre códigos**:
   - **Recovery Code**: 64 chars hex, para identificar usuario
   - **2FA TOTP**: 6 dígitos, para verificar identidad
   - **Backup Code**: ~9 chars alfanuméricos, alternativa al TOTP

5. **Frontend**: El componente muestra advertencia si quedan pocos backup codes.

## 🔗 Archivos Relacionados

- **API**: `/src/app/api/auth/recover-password/route.ts`
- **Componente**: `/src/components/auth/recover-password-form.tsx`
- **Página**: `/src/app/recover-password/page.tsx`
- **Utilities**: `/src/lib/two-factor.ts` (verifyToken, verifyHashedBackupCode)
- **Database**: `/bd_chirisu_estructura_actualizada.sql`

---

**Última actualización**: 8 de Noviembre, 2025
