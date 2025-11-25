# Usuarios de Prueba - Chirisu

Este documento contiene las credenciales de los usuarios de prueba para el sistema Chirisu.

> **Última actualización**: Contraseñas actualizadas con bcrypt (10 salt rounds) - {{ fecha actual }}

## Usuarios Disponibles

### 1. Administrador
- **Username**: admin
- **Email**: admin@chirisu.com
- **Contraseña**: boris123
- **Rol**: admin
- **ID**: 3
- **Permisos**: Acceso completo al sistema, gestión de usuarios, configuración

### 2. Moderador
- **Username**: ModMaster
- **Email**: moderator.user@example.com
- **Contraseña**: juan123
- **Rol**: moderator
- **ID**: 4
- **Permisos**: Moderación de contenido, gestión de reportes, aprobación/rechazo de contribuciones

### 3. Usuario Regular
- **Username**: JuanPerez
- **Email**: juan.perez@example.com
- **Contraseña**: pierre123
- **Rol**: user
- **ID**: 5
- **Permisos**: Acceso estándar, creación de listas, comentarios, reseñas

## Cómo Iniciar Sesión

1. Navega a: http://localhost:9002/login
2. Ingresa el email y contraseña del usuario deseado
3. El sistema te redirigirá según tu rol:
   - **Admin**: Dashboard de administración
   - **Moderador**: Panel de moderación
   - **Usuario**: Página principal

## Verificación en Base de Datos

Para verificar los usuarios en PostgreSQL:

```sql
-- Ver todos los usuarios de prueba
SELECT id, username, email, created_at 
FROM app.users 
WHERE id IN (3, 4, 5);

-- Ver roles de usuarios (si existe tabla de roles)
SELECT u.id, u.username, u.email, ur.role_id 
FROM app.users u
LEFT JOIN app.user_roles ur ON u.id = ur.user_id
WHERE u.id IN (3, 4, 5);
```

## Cambio de Contraseña

Si necesitas cambiar las contraseñas:

1. Genera nuevos hashes con bcrypt (10 salt rounds)
2. Ejecuta en la base de datos:

```sql
UPDATE app.users 
SET password_hash = '$2b$10$[tu_hash_aqui]' 
WHERE id = [id_usuario];
```

## Notas de Seguridad

⚠️ **IMPORTANTE**: 
- Estas contraseñas son solo para desarrollo
- Cambia las credenciales antes de producción
- No compartas estas credenciales públicamente
- Usa contraseñas fuertes en producción (mínimo 12 caracteres, letras, números, símbolos)

## Hash de Contraseñas Actual

Los siguientes hashes están actualmente en la base de datos:

- **admin (ID 3)**: `$2b$10$o0Mle.l.B9L50bUkCPn7bu6mcPe8jQVfa7RL2Zi7YEImdkq1QfsW.`
- **ModMaster (ID 4)**: `$2b$10$juUYa2Q6GYYxdwH8Z.UdSu/IOxVBOIOqKYGMUPwaOFMdgSZF9sEF2`
- **JuanPerez (ID 5)**: `$2b$10$gPVt4EznXwVuYmosb4vnguZrZdZauxyvN57.oyTl.WuNDug0TtUtq`
