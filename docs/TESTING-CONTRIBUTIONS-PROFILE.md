# 🧪 PRUEBA DEL SISTEMA DE CONTRIBUCIONES EN PERFIL

## 📋 **Resumen de Cambios**

Se ha completado la integración del sistema de contribuciones en el perfil del usuario, permitiendo ver **TODAS** las contribuciones con sus estados (pendiente, aprobada, rechazada).

### **Archivos Modificados:**

1. **`src/app/api/user/profile/route.ts`**
   - ✅ Query actualizada para traer **TODAS** las contribuciones (no solo aprobadas)
   - ✅ Incluye campos: `status`, `rejection_reason`, `reviewed_at`, `created_at`
   - ✅ Ordenadas por fecha de creación descendente (más recientes primero)
   - ✅ Límite de 20 contribuciones

2. **`src/components/user-contributions-card.tsx`**
   - ✅ Nuevo componente creado para mostrar todas las contribuciones
   - ✅ Diferenciación visual por estado:
     - **Pendiente**: Borde amarillo, icono de reloj
     - **Aprobada**: Borde verde, icono de check
     - **Rechazada**: Borde rojo, icono de X
   - ✅ Muestra motivo de rechazo si aplica
   - ✅ Muestra puntos otorgados si fue aprobada
   - ✅ Mensaje informativo para contribuciones pendientes

3. **`src/app/profile/page.tsx`**
   - ✅ Importado `UserContributionsCard`
   - ✅ Actualizada interfaz `UserContribution` con todos los campos
   - ✅ Reemplazado `ContributionsCard` con `UserContributionsCard`
   - ✅ Se muestra siempre (no condicionado a tener contribuciones)

---

## 🧪 **FLUJO DE PRUEBA COMPLETO**

### **PASO 1: Verificar Estado Inicial**

1. **Acceder al perfil**: http://localhost:9002/profile
2. **Verificar sección de contribuciones**:
   - Si no tienes contribuciones, debe mostrar:
     ```
     📝 No tienes contribuciones aún
     ¿Quieres ayudar a mejorar Chirisu?
     [Botón: Crear tu primera contribución]
     ```

### **PASO 2: Crear una Contribución de Anime**

1. **Ir a**: http://localhost:9002/contribution-center/add-anime

2. **Llenar el formulario**:

   **Sección 1: Información Básica**
   - Título Romaji: `Cyberpunk: Edgerunners`
   - Título Inglés: `Cyberpunk: Edgerunners`
   - Título Japonés: `サイバーパンク エッジランナーズ`
   - Tipo: `TV`
   - Origen: `Original`

   **Sección 2: Sinopsis**
   ```
   Una historia ambientada en Night City sobre un joven que decide 
   convertirse en un mercenario conocido como edgerunner.
   ```

   **Sección 3: Episodios y Fechas**
   - Episodios: `10`
   - Duración: `25`
   - Fecha Inicio: `2022-09-13`
   - Temporada: `Fall`
   - Año: `2022`
   - Estado: `Finished Airing`

   **Sección 4: Géneros**
   - Seleccionar: `Action`, `Sci-Fi`, `Drama`

   **Sección 5-7**: Puedes dejar vacío o agregar datos

   **Sección 8: Imágenes**
   - URL Cover: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-p5X5NvZN2cz1.jpg`

   **Sección 9-10**: Opcional

3. **Enviar formulario**

4. **Verificar notificación**: Debe aparecer "Contribución enviada correctamente"

### **PASO 3: Verificar en Perfil (Estado Pendiente)**

1. **Refrescar perfil**: http://localhost:9002/profile

2. **Verificar card de contribuciones**:
   - Debe aparecer tu contribución con:
     - ✅ Badge amarillo: **Pendiente**
     - ✅ Icono de reloj
     - ✅ Tipo: **Contribución Completa**
     - ✅ Medio: **Anime**
     - ✅ Título: **Cyberpunk: Edgerunners**
     - ✅ Fecha de envío
     - ✅ Mensaje: "Esta contribución está siendo revisada por el equipo de moderación"

### **PASO 4: Aprobar como Moderador**

1. **Asignar rol de moderador** (ejecutar en PostgreSQL):
   ```sql
   INSERT INTO app.user_roles (user_id, role_id)
   SELECT u.id, r.id
   FROM app.users u, app.roles r
   WHERE u.email = 'tu-email@example.com'
     AND r.name = 'moderator'
   ON CONFLICT (user_id, role_id) DO NOTHING;
   ```

2. **Ir al panel de moderación**:
   http://localhost:9002/dashboard/moderator/contributions

3. **Verificar la contribución en tab "Pendiente"**

4. **Click en "Revisar"**

5. **Click en botón verde "Aprobar Contribución"**

6. **Verificar notificación de éxito**

### **PASO 5: Verificar en Perfil (Estado Aprobado)**

1. **Refrescar perfil**: http://localhost:9002/profile

2. **Verificar cambios**:
   - ✅ Badge verde: **Aprobada**
   - ✅ Icono de checkmark
   - ✅ Fecha de revisión
   - ✅ Puntos otorgados: **50 puntos** (o los configurados)
   - ✅ El anime debe existir en la base de datos

3. **Verificar que el anime existe**:
   ```sql
   SELECT * FROM app.anime 
   WHERE title_romaji ILIKE '%Cyberpunk%';
   ```

### **PASO 6: Crear y Rechazar una Contribución**

1. **Crear otra contribución** (puede ser datos incompletos a propósito)

2. **Ir al panel de moderación**

3. **Rechazar la contribución**:
   - Click en "Rechazar"
   - Motivo: "Faltan datos importantes como el estudio de animación"
   - Confirmar

### **PASO 7: Verificar en Perfil (Estado Rechazado)**

1. **Refrescar perfil**: http://localhost:9002/profile

2. **Verificar card de contribución rechazada**:
   - ✅ Badge rojo: **Rechazada**
   - ✅ Icono de X
   - ✅ Caja roja con motivo de rechazo:
     ```
     ⚠️ Motivo del rechazo:
     "Faltan datos importantes como el estudio de animación"
     ```
   - ✅ Fecha de revisión
   - ✅ No muestra puntos

---

## ✅ **VERIFICACIONES FINALES**

### **Visualización**
- [ ] Las contribuciones pendientes se muestran con borde amarillo
- [ ] Las contribuciones aprobadas se muestran con borde verde
- [ ] Las contribuciones rechazadas se muestran con borde rojo
- [ ] Los iconos son apropiados (Clock/CheckCircle/XCircle)
- [ ] El motivo de rechazo se muestra en rojo cuando aplica

### **Datos**
- [ ] El título del anime se muestra correctamente
- [ ] Las fechas de creación y revisión son correctas
- [ ] Los puntos se muestran solo en contribuciones aprobadas
- [ ] El tipo y medio se muestran correctamente

### **Orden**
- [ ] Las contribuciones están ordenadas por fecha (más recientes primero)
- [ ] Se muestran hasta 20 contribuciones

### **Privacidad**
- [ ] Las contribuciones son visibles públicamente (cualquiera puede verlas)
- [ ] El estado es visible para todos

---

## 🐛 **QUERIES DE DEBUGGING**

### **Ver todas las contribuciones de un usuario**
```sql
SELECT 
  id,
  contributable_type as media_type,
  status,
  awarded_points,
  created_at,
  reviewed_at,
  rejection_reason,
  contribution_data->>'title' as title
FROM app.user_contributions
WHERE user_id = 1 -- Cambiar por tu user_id
ORDER BY created_at DESC;
```

### **Ver el anime creado**
```sql
SELECT 
  id,
  title_romaji,
  title_english,
  anime_type,
  total_episodes,
  status,
  average_score
FROM app.anime
WHERE title_romaji ILIKE '%Cyberpunk%';
```

### **Ver notificaciones del usuario**
```sql
SELECT 
  n.id,
  n.action_type,
  n.created_at,
  n.read_at,
  u.username as actor
FROM app.notifications n
LEFT JOIN app.users u ON n.actor_id = u.id
WHERE n.user_id = 1 -- Cambiar por tu user_id
ORDER BY n.created_at DESC;
```

### **Ver puntos del usuario**
```sql
SELECT 
  username,
  contribution_points
FROM app.users
WHERE id = 1; -- Cambiar por tu user_id
```

---

## 🎨 **DISEÑO VISUAL**

### **Contribución Pendiente (Amarillo)**
```
┌─────────────────────────────────────────┐
│ ⏱️ Pendiente                             │
│                                         │
│ 📝 Contribución Completa                │
│ 🎬 Anime                                │
│                                         │
│ Título: Cyberpunk: Edgerunners         │
│                                         │
│ Enviado: 15 de enero, 2025             │
│                                         │
│ ℹ️ Esta contribución está siendo       │
│    revisada por el equipo de           │
│    moderación                           │
└─────────────────────────────────────────┘
```

### **Contribución Aprobada (Verde)**
```
┌─────────────────────────────────────────┐
│ ✅ Aprobada                              │
│                                         │
│ 📝 Contribución Completa                │
│ 🎬 Anime                                │
│                                         │
│ Título: Cyberpunk: Edgerunners         │
│                                         │
│ Enviado: 15 de enero, 2025             │
│ Revisado: 15 de enero, 2025            │
│                                         │
│ 🏆 Puntos otorgados: 50 puntos         │
└─────────────────────────────────────────┘
```

### **Contribución Rechazada (Rojo)**
```
┌─────────────────────────────────────────┐
│ ❌ Rechazada                             │
│                                         │
│ 📝 Contribución Completa                │
│ 🎬 Anime                                │
│                                         │
│ Título: Test Anime                     │
│                                         │
│ Enviado: 15 de enero, 2025             │
│ Revisado: 15 de enero, 2025            │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ ⚠️ Motivo del rechazo:            │  │
│ │ Faltan datos importantes como el  │  │
│ │ estudio de animación              │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📊 **RESULTADO ESPERADO**

Al completar todas las pruebas, tu perfil debe mostrar:

1. **Sección de Contribuciones** con todas tus submissions
2. **Diferentes estados visuales** (amarillo/verde/rojo)
3. **Información completa** de cada contribución
4. **Motivos de rechazo** cuando aplique
5. **Puntos ganados** en contribuciones aprobadas
6. **Orden cronológico** inverso (más recientes primero)

---

## 🚀 **PRÓXIMOS PASOS OPCIONALES**

1. **Filtros**: Agregar tabs para filtrar por estado (Todas/Pendientes/Aprobadas/Rechazadas)
2. **Edición**: Permitir editar contribuciones rechazadas
3. **Detalle**: Link a página de detalle de cada contribución
4. **Estadísticas**: Mostrar totales por estado
5. **Animaciones**: Transiciones suaves al cambiar estados

---

## 📞 **SOPORTE**

Si algo no funciona:

1. Revisar logs del servidor: `npm run dev`
2. Revisar queries SQL en la documentación
3. Verificar que el usuario tenga permisos adecuados
4. Verificar que la base de datos tenga las tablas y campos correctos
