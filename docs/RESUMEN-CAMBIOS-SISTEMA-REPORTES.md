# 📋 RESUMEN COMPLETO DE CAMBIOS - SISTEMA DE REPORTES

## 🔴 PROBLEMAS CORREGIDOS

### 1. ❌ Error crítico: reviews.rating no existe
**Problema:** Query en `/api/moderation/reported-reviews/route.ts` intentaba acceder a `r.rating` y `r.likes_count` que no existen en la tabla `reviews`.

**Solución:**
```sql
-- ANTES
r.rating,
r.likes_count,

-- DESPUÉS
r.overall_score as rating,
r.helpful_votes as likes_count,
```

**Archivos modificados:**
- ✅ `src/app/api/moderation/reported-reviews/route.ts` (línea 60)

---

### 2. ❌ Reportes no aparecen para moderadores

**Problema:** Los moderadores no veían reportes porque faltaba aplicar la lógica de visibilidad correctamente.

**Solución implementada:**

#### A. API de Comentarios (`/api/admin/reported-comments`)
- Agregado: Query para obtener `is_admin` separado de `is_staff`
- Modificado: Usar `is_admin` (no `is_staff`) para la lógica de visibilidad
- Resultado: Solo admins ven TODO, moderadores ven solo casos sin asignar o asignados a ellos

```typescript
// ANTES
const isAdmin = userCheck.rows[0].is_staff; // Incorrecto

// DESPUÉS
const isAdmin = userCheck.rows[0].is_admin; // Correcto
```

**Archivos modificados:**
- ✅ `src/app/api/admin/reported-comments/route.ts` (líneas 26-42)

#### B. API de Contenido (`/api/content-reports`)
- Agregado: Documentación clara de parámetros `currentUserId` e `isAdmin`
- Corregido: Orden de parámetros en query (evitar desfase en `$N`)
- Mantenido: Lógica de visibilidad con regla de 15 días

**Archivos modificados:**
- ✅ `src/app/api/content-reports/route.ts` (líneas 71-95)

#### C. Componente de Comentarios
- Agregado: Envío de `currentUserId` e `isAdmin` en la petición
- Antes: `fetch(\`/api/admin/reported-comments?status=${status}\`)`
- Después: `fetch(\`/api/admin/reported-comments?status=${status}&currentUserId=${user?.id}&isAdmin=${user?.isAdmin}\`)`

**Archivos modificados:**
- ✅ `src/components/moderation/reported-comments-content.tsx` (línea 83)

---

### 3. ❌ Sistema de notificaciones incorrecto

**Problema:** Todas las notificaciones usaban `action_type` genérico (`'report_pending'`), sin distinguir entre tipos de reportes.

**Solución:**

#### A. Triggers de base de datos creados
Se crearon 3 nuevos triggers para notificar automáticamente a admins/moderadores:

1. **`trg_notify_new_comment_report`**
   - Tabla: `app.comment_reports`
   - action_type: `'comment_reported'`
   - notifiable_type: `'comment_report'`

2. **`trg_notify_new_review_report`**
   - Tabla: `app.review_reports`
   - action_type: `'review_reported'`
   - notifiable_type: `'review_report'`

3. **`trg_notify_new_user_report`**
   - Tabla: `app.user_reports`
   - action_type: `'user_reported'`
   - notifiable_type: `'user_report'`

4. **Trigger actualizado: `fn_notify_new_report`**
   - Tabla: `app.content_reports`
   - action_type: `'content_report'` (antes: `'report_pending'`)
   - notifiable_type: `'content_report'` (antes: `'report'`)

**Archivos creados:**
- ✅ `db-migrations/create-notification-triggers-for-reports.sql`
- ✅ Ejecutado en base de datos BD_CHIRISU

---

### 4. ❌ Centro de notificaciones no redirige correctamente

**Problema:** Las notificaciones no sabían a qué página enviar al usuario según el tipo de reporte.

**Solución:**

Actualizado `notifications-button.tsx` con routing específico por tipo:

```typescript
// Reportes de comentarios
else if (actionType === 'comment_reported' || notifiableType === 'comment_report') {
  router.push('/dashboard/moderator/reported-comments');
}
// Reportes de reviews
else if (actionType === 'review_reported' || notifiableType === 'review_report') {
  router.push('/dashboard/moderator/reported-reviews');
}
// Reportes de usuarios
else if (actionType === 'user_reported' || notifiableType === 'user_report') {
  router.push('/dashboard/moderator/reported-users');
}
// Reportes de contenido (anime, manga, etc.)
else if (actionType === 'content_report' || notifiableType === 'content_report') {
  router.push('/dashboard/moderator/reported-content/anime');
}
```

**Mensajes de notificación actualizados:**

```typescript
case 'comment_reported':
  return `${actor} reportó un comentario para revisión`;
case 'review_reported':
  return `${actor} reportó una reseña para revisión`;
case 'user_reported':
  return `${actor} reportó a un usuario para revisión`;
case 'content_report':
  return `${actor} reportó un problema en ${contentName}`;
```

**Archivos modificados:**
- ✅ `src/components/user/notifications-button.tsx` (líneas 78-120, 128-172)

---

### 5. ⚠️ Logging mejorado en reportes de contenido

**Problema:** No había logs suficientes para debuggear errores en creación de reportes.

**Solución:**

Agregado logging detallado en `/api/content-reports POST`:
- 📝 Log de datos recibidos
- ❌ Log de validaciones fallidas
- 💾 Log antes de insertar en BD
- ✅ Log de éxito con ID del reporte

**Archivos modificados:**
- ✅ `src/app/api/content-reports/route.ts` (líneas 18-54)

---

## 📊 TABLA DE NOTIFICACIONES

| Tipo de Reporte | action_type | notifiable_type | Página de destino |
|-----------------|-------------|-----------------|-------------------|
| Contenido (anime, manga, etc.) | `content_report` | `content_report` | `/dashboard/moderator/reported-content/[type]` |
| Comentario | `comment_reported` | `comment_report` | `/dashboard/moderator/reported-comments` |
| Reseña | `review_reported` | `review_report` | `/dashboard/moderator/reported-reviews` |
| Usuario | `user_reported` | `user_report` | `/dashboard/moderator/reported-users` |

---

## 🔒 REGLA DE VISIBILIDAD (15 DÍAS)

Aplicada en todas las APIs de reportes:

```sql
WHERE status = $1
  AND (
    $isAdmin = true                                           -- Admins ven TODO
    OR assigned_to IS NULL                                    -- Casos sin asignar (todos los mods)
    OR assigned_to = $currentUserId                          -- Tus casos asignados
    OR (assigned_at < NOW() - INTERVAL '15 days'             -- Casos abandonados (>15 días)
        AND status != 'resolved')
  )
```

**APIs con regla implementada:**
- ✅ `/api/content-reports` (GET)
- ✅ `/api/admin/reported-comments` (GET)
- ✅ `/api/moderation/reported-reviews` (GET)
- ✅ `/api/user-reports` (GET)

---

## 📁 ARCHIVOS MODIFICADOS (RESUMEN)

### APIs (5 archivos)
1. ✅ `src/app/api/moderation/reported-reviews/route.ts`
2. ✅ `src/app/api/admin/reported-comments/route.ts`
3. ✅ `src/app/api/content-reports/route.ts`
4. ✅ `src/app/api/user-reports/route.ts` (existente, ya tenía la lógica)
5. ✅ APIs de asignación (`/[id]/assign`) ya implementadas previamente

### Componentes (2 archivos)
1. ✅ `src/components/moderation/reported-comments-content.tsx`
2. ✅ `src/components/user/notifications-button.tsx`

### Migraciones de Base de Datos (1 archivo)
1. ✅ `db-migrations/create-notification-triggers-for-reports.sql`

---

## 🧪 TESTING PENDIENTE

### Manual Testing Checklist:

#### 1. Crear Reportes
- [ ] Reportar contenido (anime/manga/etc.) desde SocialsCard → botón "Reportar"
- [ ] Reportar comentario desde cualquier sección de comentarios
- [ ] Reportar reseña desde página de anime/manga
- [ ] Reportar usuario desde perfil

#### 2. Verificar Notificaciones
- [ ] Admins reciben notificación de cada tipo
- [ ] Moderadores reciben notificación de cada tipo
- [ ] action_type es correcto ('content_report', 'comment_reported', etc.)
- [ ] notifiable_type es correcto
- [ ] Mensaje de notificación es descriptivo

#### 3. Verificar Redirección
- [ ] Click en notificación de comentario → `/dashboard/moderator/reported-comments`
- [ ] Click en notificación de review → `/dashboard/moderator/reported-reviews`
- [ ] Click en notificación de usuario → `/dashboard/moderator/reported-users`
- [ ] Click en notificación de contenido → `/dashboard/moderator/reported-content/anime`

#### 4. Verificar Visibilidad
- [ ] **Moderador 1:**
  - Ver reportes pendientes sin asignar ✅
  - NO ver reportes asignados a Moderador 2 ❌
  - Ver reportes asignados a sí mismo ✅
- [ ] **Moderador 2:**
  - Ver reportes pendientes sin asignar ✅
  - NO ver reportes asignados a Moderador 1 ❌
  - Ver reportes asignados a sí mismo ✅
- [ ] **Admin:**
  - Ver TODOS los reportes sin importar asignación ✅

#### 5. Verificar Regla de 15 Días
- [ ] Asignar reporte a Moderador 1
- [ ] Cambiar `assigned_at` en BD a hace 16 días: 
  ```sql
  UPDATE app.comment_reports SET assigned_at = NOW() - INTERVAL '16 days' WHERE id = X;
  ```
- [ ] Verificar que Moderador 2 ahora puede ver el caso
- [ ] Verificar que aparece badge "⚠️ Caso abandonado" o similar

#### 6. Verificar Acciones
- [ ] Tomar caso (asigna correctamente)
- [ ] Liberar caso (limpia asignación)
- [ ] Resolver reporte (cambia status, registra en audit_log)
- [ ] Rechazar reporte (cambia status, registra en audit_log)

---

## 🐛 ERRORES CONOCIDOS (SI LOS HAY)

### Error al reportar desde redes sociales - "actualizar información"
**Estado:** ⚠️ Pendiente de verificar

**Posible causa:**
- Frontend puede estar enviando `title` vacío o undefined
- Validación actual requiere `description` pero no `title`

**Acción:**
1. Probar crear reporte desde SocialsCard
2. Revisar logs de consola del servidor
3. Si hay error, verificar exactamente qué datos se están enviando
4. Ajustar validación en `report-problem-dialog.tsx` si es necesario

**Logs agregados para debugging:**
```typescript
console.log('📝 Recibiendo reporte de contenido:', { userId, reportableType, reportableId, issueType, title, description });
console.error('❌ Validación fallida - Campos faltantes:', { userId, reportableType, reportableId, description: !!description });
```

---

## 🎯 PRÓXIMOS PASOS

1. **Testing manual** de todo el flujo (checklist arriba)
2. **Verificar logs** en terminal al crear reportes
3. **Corregir** cualquier error encontrado durante testing
4. **Documentar** casos edge descubiertos
5. **Optimizar** queries si hay problemas de performance
6. **Mejorar UX** según feedback de moderadores

---

## 📞 SOPORTE

Si encuentras algún problema:

1. Revisar logs del servidor (terminal donde corre `npm run dev`)
2. Revisar Network tab en DevTools del navegador
3. Verificar que los triggers están instalados:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'app' 
   AND trigger_name LIKE '%notify%'
   ORDER BY event_object_table;
   ```
4. Verificar datos en tablas:
   ```sql
   SELECT * FROM app.notifications WHERE action_type IN ('content_report', 'comment_reported', 'review_reported', 'user_reported') ORDER BY created_at DESC LIMIT 10;
   ```

---

**Fecha:** 2025-01-11  
**Autor:** GitHub Copilot  
**Versión:** 1.0
