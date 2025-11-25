# 🔔 SISTEMA DE NOTIFICACIONES Y PANEL DE MODERACIÓN - IMPLEMENTADO

## 📋 **Resumen de Cambios**

Se ha implementado un sistema completo de notificaciones y se han corregido las rutas de moderación/administración.

---

## ✅ **Cambios Realizados**

### **1. Sistema de Notificaciones en Navbar**

#### **Nuevo Componente: `notifications-button.tsx`**
- ✅ Badge con contador de notificaciones no leídas
- ✅ Dropdown con lista de notificaciones
- ✅ Actualización automática cada 30 segundos
- ✅ Marca notificaciones como leídas al hacer click
- ✅ Navega a la página correspondiente según tipo de notificación
- ✅ Formateo de fechas con `date-fns` (relativo: "hace 2 horas")

#### **Tipos de Notificaciones:**
- `contribution_submitted`: Nueva contribución enviada (para admins/mods)
- `contribution_approved`: Tu contribución fue aprobada
- `contribution_rejected`: Tu contribución fue rechazada

#### **Integración en `main-nav.tsx`:**
```tsx
import NotificationsButton from "./notifications-button";

// En el render:
{user && <NotificationsButton />}
```

### **2. API de Notificaciones**

#### **`/api/user/notifications` (GET)**
- Retorna notificaciones no leídas del usuario actual
- Incluye información del actor (quien generó la notificación)
- Formato de respuesta:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "action_type": "contribution_submitted",
      "notifiable_type": "contribution",
      "notifiable_id": 123,
      "created_at": "2025-10-17T...",
      "actor_username": "usuario123",
      "actor_avatar": "https://..."
    }
  ],
  "total": 5
}
```

#### **`/api/user/notifications/[id]` (PATCH)**
- Marca una notificación como leída
- Actualiza el campo `read_at`

### **3. Sistema de Notificaciones Backend**

#### **`lib/notifications.ts`**
Funciones helper:
- `createNotification()`: Crea notificación individual
- `notifyAdminsAndMods()`: Notifica a todos los admins/mods
- `markNotificationAsRead()`: Marca como leída
- `getUnreadNotifications()`: Obtiene no leídas

#### **Flujo de Notificaciones:**
1. Usuario envía contribución → `notifyAdminsAndMods()` se ejecuta
2. Todos los usuarios con rol admin/moderator reciben notificación
3. Aparece badge en navbar con contador
4. Admin/mod hace click → marca como leída → navega a panel

### **4. Rutas de Dashboard Actualizadas**

#### **`/dashboard/moderator`**
- ✅ Redirige automáticamente a `/dashboard/moderator/contributions`
- ✅ Verifica autenticación y permisos
- ✅ Accesible para moderators y admins

#### **`/dashboard/admin`**
- ✅ Redirige automáticamente a `/dashboard/moderator/contributions`
- ✅ Solo accesible para admins
- ✅ En el futuro tendrá funciones adicionales

#### **`/dashboard/moderator/contributions`**
- ✅ Panel de moderación funcional
- ✅ Tabs: Pendiente / Aprobada / Rechazada
- ✅ Lista todas las contribuciones por estado
- ✅ Botón "Revisar" para cada contribución

#### **`/dashboard/moderator/contributions/[id]`**
- ✅ Vista detallada de contribución
- ✅ Botones: Aprobar (verde) / Rechazar (rojo)
- ✅ Campo para motivo de rechazo

### **5. AuthContext Actualizado**

#### **Nueva Interfaz User:**
```typescript
export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  // Alias para compatibilidad
  name?: string;  // = displayName
  image?: string | null;  // = avatarUrl
  role?: 'admin' | 'moderator' | 'user';  // derivado de isAdmin/isModerator
  lists?: {...};
  customLists?: [...];
}
```

#### **Función `enrichUser()`:**
- Agrega campos alias automáticamente
- Calcula `role` basado en `isAdmin`/`isModerator`
- Aplica en login y checkSession

---

## 🧪 **FLUJO DE PRUEBA COMPLETO**

### **PASO 1: Verificar Roles en Base de Datos**

```sql
-- Ver tu usuario y roles
SELECT 
  u.id,
  u.username,
  u.email,
  r.name as role
FROM app.users u
LEFT JOIN app.user_roles ur ON u.id = ur.user_id
LEFT JOIN app.roles r ON ur.role_id = r.id
WHERE u.email = 'tu-email@example.com';
```

```sql
-- Asignar rol de moderador si no lo tienes
INSERT INTO app.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM app.users u, app.roles r
WHERE u.email = 'tu-email@example.com'
  AND r.name = 'moderator'
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### **PASO 2: Enviar una Contribución**

1. **Crear una contribución como usuario normal**:
   - Ir a: http://localhost:9002/contribution-center/add-anime
   - Llenar el formulario con datos mínimos
   - Enviar

2. **Verificar que se creó la notificación**:
```sql
SELECT 
  n.*,
  u_recipient.username as recipient,
  u_actor.username as actor
FROM app.notifications n
JOIN app.users u_recipient ON n.recipient_user_id = u_recipient.id
LEFT JOIN app.users u_actor ON n.actor_user_id = u_actor.id
ORDER BY n.created_at DESC
LIMIT 10;
```

### **PASO 3: Ver Notificación en Navbar**

1. **Iniciar sesión como moderador/admin**
2. **Verificar navbar**:
   - ✅ Debe aparecer icono de campana (🔔)
   - ✅ Debe tener badge rojo con número de notificaciones
   - ✅ Ejemplo: "1" o "9+"

3. **Click en la campana**:
   - ✅ Debe abrir dropdown
   - ✅ Debe mostrar: "usuario123 envió una nueva contribución para revisión"
   - ✅ Debe mostrar: "hace X minutos"

4. **Click en la notificación**:
   - ✅ Debe marcar como leída
   - ✅ Debe desaparecer del contador
   - ✅ Debe navegar a: `/dashboard/moderator/contributions`

### **PASO 4: Revisar en Panel de Moderación**

1. **Verificar que llegaste al panel**:
   - URL: http://localhost:9002/dashboard/moderator/contributions
   - ✅ Debe mostrar tabs: Pendiente / Aprobada / Rechazada
   - ✅ Tab "Pendiente" debe estar seleccionada
   - ✅ Debe mostrar la contribución recién enviada

2. **Click en "Revisar"**:
   - ✅ Debe navegar a: `/dashboard/moderator/contributions/[id]`
   - ✅ Debe mostrar todos los detalles
   - ✅ Botones: "Aprobar Contribución" / "Rechazar Contribución"

### **PASO 5: Aprobar Contribución**

1. **Click en "Aprobar Contribución"**
2. **Verificar:**
   - ✅ Notificación de éxito
   - ✅ Redirige a lista de contribuciones
   - ✅ Contribución ya no está en "Pendiente"
   - ✅ Contribución está en tab "Aprobada"

3. **Verificar anime creado**:
```sql
SELECT * FROM app.anime 
WHERE title_romaji ILIKE '%título%'
ORDER BY created_at DESC
LIMIT 5;
```

4. **Verificar notificación al usuario**:
```sql
SELECT * FROM app.notifications
WHERE action_type = 'contribution_approved'
ORDER BY created_at DESC
LIMIT 5;
```

5. **Iniciar sesión como el usuario que envió**:
   - ✅ Debe ver notificación en navbar
   - ✅ "Tu contribución fue aprobada"
   - ✅ Click → navega a perfil
   - ✅ En perfil, contribución está en verde con puntos

### **PASO 6: Rechazar Contribución**

1. **Enviar otra contribución**
2. **Como moderador, ir al panel**
3. **Click en "Rechazar Contribución"**
4. **Escribir motivo**: "Faltan datos del estudio de animación"
5. **Confirmar rechazo**

6. **Verificar:**
   - ✅ Notificación de éxito
   - ✅ Contribución en tab "Rechazada"
   - ✅ Usuario recibe notificación

7. **Como usuario, verificar**:
   - ✅ Notificación: "Tu contribución fue rechazada"
   - ✅ Click → perfil
   - ✅ Contribución en rojo con motivo visible

---

## 🔍 **VERIFICACIONES**

### **Badge de Notificaciones:**
```javascript
// En el navegador, abrir consola y ejecutar:
await fetch('/api/user/notifications')
  .then(r => r.json())
  .then(console.log)

// Debe retornar:
{
  success: true,
  notifications: [...],
  total: X
}
```

### **Actualización Automática:**
- El badge se actualiza cada 30 segundos
- No necesitas refrescar la página
- Las notificaciones nuevas aparecen automáticamente

### **Flujo de Navegación:**
1. **Usuario → Centro de Aportes → Enviar**
2. **Admin/Mod → Ve notificación (30s o menos)**
3. **Admin/Mod → Click → Panel de Moderación**
4. **Admin/Mod → Revisar → Aprobar/Rechazar**
5. **Usuario → Ve notificación → Perfil → Ve estado**

---

## 🎨 **Interfaz de Usuario**

### **Badge de Notificaciones:**
```
┌────────────────┐
│  🔔  [1]       │  ← Badge rojo con número
└────────────────┘
```

### **Dropdown Abierto:**
```
┌─────────────────────────────────────┐
│ Notificaciones          [1 nuevas]  │
├─────────────────────────────────────┤
│ • usuario123 envió una nueva        │
│   contribución para revisión        │
│   hace 5 minutos                    │
├─────────────────────────────────────┤
│          [Ver todas]                │
└─────────────────────────────────────┘
```

### **Sin Notificaciones:**
```
┌─────────────────────────────────────┐
│ Notificaciones                      │
├─────────────────────────────────────┤
│                                     │
│         🔔                          │
│   No tienes notificaciones          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 **Queries de Debugging**

### **Ver todas las notificaciones:**
```sql
SELECT 
  n.id,
  n.action_type,
  n.created_at,
  n.read_at,
  u_recipient.username as recipient,
  u_actor.username as actor
FROM app.notifications n
JOIN app.users u_recipient ON n.recipient_user_id = u_recipient.id
LEFT JOIN app.users u_actor ON n.actor_user_id = u_actor.id
ORDER BY n.created_at DESC;
```

### **Ver notificaciones no leídas de un usuario:**
```sql
SELECT * FROM app.notifications
WHERE recipient_user_id = 1  -- Tu user_id
  AND read_at IS NULL
ORDER BY created_at DESC;
```

### **Ver contribuciones pendientes:**
```sql
SELECT 
  uc.*,
  u.username as contributor
FROM app.user_contributions uc
JOIN app.users u ON uc.user_id = u.id
WHERE uc.status = 'pending'
ORDER BY uc.created_at DESC;
```

### **Limpiar notificaciones de prueba:**
```sql
DELETE FROM app.notifications
WHERE action_type IN ('contribution_submitted', 'contribution_approved', 'contribution_rejected');
```

---

## 🚀 **Características Implementadas**

### **Sistema de Notificaciones:**
- ✅ Badge visual con contador
- ✅ Actualización en tiempo real (cada 30s)
- ✅ Marca como leído al hacer click
- ✅ Navegación contextual
- ✅ Formateo de fechas relativas
- ✅ Estado vacío amigable
- ✅ ScrollArea para muchas notificaciones
- ✅ Separación de tipos de notificación

### **Panel de Moderación:**
- ✅ Redireccionamiento automático
- ✅ Verificación de permisos
- ✅ Integración con contribuciones
- ✅ Mismo panel para admin y moderator

### **AuthContext:**
- ✅ Campos alias para compatibilidad
- ✅ Cálculo automático de rol
- ✅ Función `enrichUser()` reutilizable

---

## 🐛 **Solución de Problemas**

### **No aparecen notificaciones:**
1. Verificar que el usuario tenga rol admin/moderator
2. Verificar que se creó la contribución
3. Ejecutar query para ver notificaciones en BD
4. Revisar consola del navegador (Network tab)

### **Badge no actualiza:**
1. El intervalo es de 30 segundos
2. Refrescar página manualmente
3. Verificar que no hay errores en consola

### **No redirige correctamente:**
1. Verificar que el usuario está autenticado
2. Verificar rol en AuthContext
3. Revisar logs del servidor

---

## 📝 **Próximas Mejoras**

### **Sistema de Notificaciones:**
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Notificaciones push del navegador
- [ ] Filtros por tipo de notificación
- [ ] Marcar todas como leídas
- [ ] Eliminar notificaciones

### **Panel de Moderación:**
- [ ] Estadísticas de moderación
- [ ] Historial de acciones
- [ ] Búsqueda y filtros avanzados
- [ ] Asignación de revisores

### **Admin Dashboard:**
- [ ] Gestión de usuarios
- [ ] Configuración del sitio
- [ ] Logs de sistema
- [ ] Analytics

---

## ✨ **Instalación de Dependencias**

Si aún no lo has hecho, instala `date-fns`:

```bash
npm install date-fns
```

---

## 🎯 **Estado Final**

- ✅ Sistema de notificaciones funcionando
- ✅ Badge visible en navbar
- ✅ Notificaciones se crean al enviar contribuciones
- ✅ Panel de moderación accesible
- ✅ Rutas de dashboard redirigen correctamente
- ✅ AuthContext con roles compatibles
- ✅ Flujo completo end-to-end funcional

**El sistema está listo para usar! 🚀**
