# 🎬 SISTEMA DE CONTRIBUCIÓN DE ANIME - DOCUMENTACIÓN COMPLETA

## 📋 Resumen Ejecutivo

Sistema completo de contribución de anime que permite a los usuarios agregar contenido completo a la plataforma, pasando por un proceso de moderación antes de ser publicado.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. Flujo de Contribución

```
Usuario → Formulario Completo → API Contribución → Base de Datos (pending)
                                        ↓
                                  Notificación a Admins/Mods
                                        ↓
                          Moderador revisa en Panel
                                        ↓
                            Aprobar ↙        ↘ Rechazar
                                   ↓                ↓
                      Crear Anime + Relaciones    Notificar rechazo
                                   ↓                ↓
                      Notificar aprobación    Usuario ve motivo
                                   ↓
                         Otorgar puntos (automático)
```

---

## 📂 ARCHIVOS CREADOS

### API Endpoints

1. **`/api/genres/route.ts`**
   - GET: Obtiene todos los géneros activos de la base de datos

2. **`/api/studios/route.ts`**
   - GET: Búsqueda de estudios por nombre
   - POST: Crear nuevo estudio (o retornar existente)

3. **`/api/staff/route.ts`**
   - GET: Búsqueda de staff por nombre
   - POST: Crear nuevo miembro del staff

4. **`/api/characters/route.ts`** (actualizado)
   - POST: Crear nuevo personaje

5. **`/api/user/contributions/route.ts`** (actualizado)
   - POST: Ahora notifica a admins/mods cuando se crea contribución

6. **`/api/user/notifications/route.ts`**
   - GET: Obtiene notificaciones del usuario

7. **`/api/user/notifications/[id]/route.ts`**
   - PATCH: Marca notificación como leída

8. **`/api/moderation/contributions/route.ts`**
   - GET: Obtiene contribuciones (solo admins/mods)
   - Filtros: status (pending, approved, rejected)

9. **`/api/moderation/contributions/[id]/route.ts`**
   - GET: Obtiene detalle de una contribución
   - PATCH: Aprobar o rechazar contribución

### Componentes

1. **`components/studio-selector.tsx`**
   - Búsqueda de estudios existentes
   - Creación de nuevos estudios inline
   - Marca de estudio principal

2. **`components/staff-selector.tsx`**
   - Búsqueda de staff existente
   - Creación de nuevo staff inline
   - Asignación de roles (Director, Original Creator, etc.)

3. **`components/character-selector.tsx`**
   - Búsqueda de personajes existentes
   - Creación de nuevos personajes inline
   - Asignación de roles (Principal/Secundario)

4. **`components/anime-contribution-form.tsx`**
   - Formulario completo de 10 secciones
   - Validación con Zod
   - Integración con todos los selectores

### Páginas

1. **`app/contribution-center/add-anime/page.tsx`** (actualizado)
   - Ahora usa el formulario completo

2. **`app/dashboard/moderator/contributions/page.tsx`**
   - Panel de moderación con tabs (Pendientes/Aprobadas/Rechazadas)
   - Lista de contribuciones con vista previa

3. **`app/dashboard/moderator/contributions/[id]/page.tsx`**
   - Vista detallada de contribución
   - Botones para aprobar/rechazar
   - Campo para motivo de rechazo

### Helpers

1. **`lib/notifications.ts`**
   - `createNotification()`: Crea notificación individual
   - `notifyAdminsAndMods()`: Notifica a todos los admins/mods
   - `markNotificationAsRead()`: Marca como leída
   - `getUnreadNotifications()`: Obtiene no leídas

---

## 📊 ESTRUCTURA DEL FORMULARIO

### Sección 1: Información Básica
- Título Romaji * (requerido)
- Título Inglés
- Título Español
- Título Nativo
- Tipo * (TV, Movie, OVA, ONA, Special, Music)
- Fuente (Manga, Light Novel, Original, etc.)

### Sección 2: Sinopsis
- Sinopsis * (mínimo 20 caracteres)

### Sección 3: Episodios y Fechas
- Número de episodios
- Duración por episodio (minutos)
- Fecha de inicio
- Fecha de fin
- Estado * (Finalizado, En emisión, etc.)
- Temporada (Winter, Spring, Summer, Fall)
- Año

### Sección 4: Géneros
- Selección múltiple desde base de datos *
- Carga dinámica de géneros

### Sección 5: Estudios
- Búsqueda o creación de estudios
- Marca de estudio principal
- Múltiples estudios permitidos

### Sección 6: Staff
- Búsqueda o creación de personal
- Roles: Director, Original Creator, Script, etc.
- Múltiples miembros permitidos

### Sección 7: Personajes
- Búsqueda o creación de personajes
- Roles: Principal / Secundario
- Múltiples personajes permitidos

### Sección 8: Imágenes y Multimedia
- URL de portada
- URL de banner
- URL de tráiler (YouTube)

### Sección 9: IDs Externos
- MyAnimeList ID
- AniList ID
- Kitsu ID

### Sección 10: Otros Metadatos
- País de origen
- Clasificación NSFW

---

## 🔄 PROCESO DE APROBACIÓN

### Cuando se aprueba una contribución:

1. **Crear registro en tabla `anime`**
   - Todos los campos del formulario
   - `created_by`: ID del usuario contribuyente
   - `updated_by`: ID del moderador
   - `is_approved`: TRUE
   - `is_published`: TRUE

2. **Insertar relaciones en tablas pivot:**
   - `media_genres`: Asociar géneros
   - `studiable_studios`: Asociar estudios (con flag is_main_studio)
   - `staffable_staff`: Asociar staff con roles
   - `characterable_characters`: Asociar personajes con roles

3. **Actualizar tabla `user_contributions`:**
   - `status`: 'approved'
   - `contributable_id`: ID del anime creado
   - `reviewed_by`: ID del moderador
   - `reviewed_at`: Timestamp actual

4. **Notificar al usuario:**
   - Crear notificación de aprobación
   - El trigger de BD automáticamente otorga puntos

5. **Triggers automáticos de BD:**
   - Incrementa `users.contributions_count`
   - Otorga puntos según `action_points.approve_contribution`
   - Actualiza `users.level` si es necesario

### Cuando se rechaza una contribución:

1. **Actualizar tabla `user_contributions`:**
   - `status`: 'rejected'
   - `reviewed_by`: ID del moderador
   - `reviewed_at`: Timestamp actual
   - `rejection_reason`: Motivo del rechazo

2. **Notificar al usuario:**
   - Crear notificación de rechazo
   - Usuario puede ver el motivo en su perfil

---

## 🔐 PERMISOS Y SEGURIDAD

### Roles requeridos:
- **Usuario normal**: Puede enviar contribuciones
- **Moderador**: Puede revisar, aprobar y rechazar
- **Admin**: Puede revisar, aprobar y rechazar

### Validaciones:
- Autenticación requerida para enviar contribuciones
- Verificación de rol para acceder al panel de moderación
- Transacciones de BD para garantizar integridad
- ROLLBACK automático en caso de error

---

## 📊 TABLAS DE BASE DE DATOS INVOLUCRADAS

### Escritura:
- `anime` - Registro principal del anime
- `media_genres` - Relación anime-géneros
- `studiable_studios` - Relación anime-estudios
- `staffable_staff` - Relación anime-staff
- `characterable_characters` - Relación anime-personajes
- `user_contributions` - Registro de contribución
- `notifications` - Notificaciones a usuarios/mods
- `users` - Actualización de puntos/nivel (via triggers)
- `audit_log` - Registro de auditoría (via triggers)

### Lectura:
- `genres` - Lista de géneros
- `studios` - Lista de estudios
- `staff` - Lista de personal
- `characters` - Lista de personajes
- `media_statuses` - Estados del anime
- `roles` - Verificación de permisos
- `user_roles` - Verificación de permisos

---

## 🧪 TESTING - PASOS A SEGUIR

### 1. Preparación
```bash
# Asegurarse de que el servidor está corriendo
npm run dev
```

### 2. Crear Contribución (Usuario)
- Ir a: http://localhost:9002/contribution-center
- Click en "Anime"
- Completar el formulario completo:
  - Título Romaji: "Jujutsu Kaisen Test"
  - Tipo: TV
  - Sinopsis: "Una historia de prueba para el sistema de contribuciones..."
  - Seleccionar al menos 1 género
  - Agregar al menos 1 estudio
  - (Opcional) Agregar staff y personajes
- Click en "Enviar para Revisión"

### 3. Verificar Notificación (Moderador)
- Iniciar sesión como admin/moderador
- Verificar que aparece notificación nueva
- Verificar en BD:
```sql
SELECT * FROM app.notifications 
WHERE action_type = 'contribution_submitted' 
ORDER BY created_at DESC LIMIT 5;
```

### 4. Revisar Contribución (Moderador)
- Ir a: http://localhost:9002/dashboard/moderator/contributions
- Verificar que aparece en tab "Pendientes"
- Click en "Revisar"
- Verificar que todos los datos se muestran correctamente

### 5. Aprobar Contribución (Moderador)
- En la página de detalle, click en "Aprobar Contribución"
- Verificar mensaje de éxito
- Verificar en BD:
```sql
-- Ver anime creado
SELECT * FROM app.anime ORDER BY created_at DESC LIMIT 1;

-- Ver géneros asociados
SELECT * FROM app.media_genres WHERE titleable_id = [ANIME_ID];

-- Ver estudios asociados
SELECT * FROM app.studiable_studios WHERE studiable_id = [ANIME_ID];

-- Ver contribución aprobada
SELECT * FROM app.user_contributions WHERE id = [CONTRIBUTION_ID];

-- Ver puntos otorgados
SELECT points, level, contributions_count FROM app.users WHERE id = [USER_ID];

-- Ver notificación de aprobación
SELECT * FROM app.notifications 
WHERE action_type = 'contribution_approved' 
ORDER BY created_at DESC LIMIT 1;
```

### 6. Probar Rechazo (Moderador)
- Crear otra contribución de prueba
- En el panel de moderación, click en "Revisar"
- Escribir motivo de rechazo en el campo
- Click en "Rechazar Contribución"
- Verificar que el usuario recibe notificación con el motivo

### 7. Verificar Notificaciones (Usuario)
- Iniciar sesión como el usuario que creó la contribución
- Verificar notificación de aprobación/rechazo
- (Futuro) Ver en perfil la contribución aprobada

---

## 🐛 POSIBLES ERRORES Y SOLUCIONES

### Error: "No se pudieron cargar los géneros"
- **Causa**: Tabla genres vacía
- **Solución**: Ejecutar INSERT de géneros del schema SQL

### Error: "No tienes permisos"
- **Causa**: Usuario no tiene rol admin/moderator
- **Solución**: Insertar rol en user_roles:
```sql
INSERT INTO app.user_roles (user_id, role_id)
SELECT [USER_ID], id FROM app.roles WHERE name = 'moderator';
```

### Error: "El estudio ya existe"
- **Causa**: Búsqueda case-insensitive encuentra duplicado
- **Solución**: Retorna el existente (comportamiento correcto)

### Error en transacción de aprobación
- **Causa**: Datos inválidos o relación faltante
- **Solución**: Verificar logs de consola, se hace ROLLBACK automático

---

## 🚀 PRÓXIMAS MEJORAS

1. **Upload de imágenes**: Permitir subir portadas en lugar de URLs
2. **Preview en tiempo real**: Mostrar vista previa del anime mientras se llena el formulario
3. **Edición de contribuciones rechazadas**: Permitir al usuario editar y reenviar
4. **Historial de contribuciones**: Ver todas las contribuciones del usuario
5. **Búsqueda avanzada en selectores**: Filtros y paginación
6. **Validación de URLs**: Verificar que las imágenes/tráilers existen
7. **Relacionar con adaptaciones**: Permitir relacionar anime con manga/novel fuente
8. **Tags adicionales**: Temas, demografía, etc.
9. **Centro de notificaciones**: UI completa para ver todas las notificaciones
10. **Estadísticas de contribuciones**: Dashboard con métricas

---

## 📝 NOTAS IMPORTANTES

- ✅ Todos los endpoints usan transacciones para garantizar consistencia
- ✅ Los triggers de BD manejan automáticamente puntos y contadores
- ✅ Sistema de notificaciones completamente funcional
- ✅ Validación exhaustiva en frontend y backend
- ✅ Soporte para crear entidades nuevas inline (studios, staff, characters)
- ✅ Panel de moderación con tabs y filtros
- ✅ Vista detallada completa de contribuciones

---

## 🎯 ESTADO ACTUAL: LISTO PARA TESTING

Todos los componentes están implementados y listos para probar el flujo completo.
