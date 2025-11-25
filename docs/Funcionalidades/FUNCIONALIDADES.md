# Funcionalidades del Proyecto Chirisu

## Tabla de Contenidos
1. [Sistema de Usuarios y Autenticación](#sistema-de-usuarios-y-autenticación)
2. [Sistema de Medios (Anime, Manga, etc.)](#sistema-de-medios)
3. [Sistema de Listas de Usuario](#sistema-de-listas-de-usuario)
4. [Sistema de Favoritos](#sistema-de-favoritos)
5. [Sistema de Reseñas](#sistema-de-reseñas)
6. [Sistema de Comentarios](#sistema-de-comentarios)
7. [Sistema de Contribuciones](#sistema-de-contribuciones)
8. [Sistema de Notificaciones](#sistema-de-notificaciones)
9. [Sistema de Moderación](#sistema-de-moderación)
10. [Sistema de Ranking y Estadísticas](#sistema-de-ranking-y-estadísticas)
11. [Sistema de Personajes y Personal](#sistema-de-personajes-y-personal)
12. [Sistema de Puntos y Niveles](#sistema-de-puntos-y-niveles)

---

## Sistema de Usuarios y Autenticación

### Registro y Login
- **Registro de nuevos usuarios**
  - Validación de email único
  - Validación de username único
  - Hash seguro de contraseñas (bcrypt)
  - Asignación automática de nivel 1 y 0 puntos
  - Asignación de rol "user" por defecto

- **Inicio de sesión**
  - Login con email o username
  - Autenticación mediante JWT
  - Cookie segura `chirisu_session`
  - Expiración configurable del token (24 horas)

- **Verificación de sesión**
  - Endpoint `/api/auth/session`
  - Validación de token JWT
  - Obtención de roles (admin, moderator, user)
  - Detección automática de permisos

### Perfiles de Usuario
- **Información básica**
  - Username
  - Display name
  - Avatar URL
  - Bio/descripción
  - Nivel y puntos
  - Fecha de registro

- **Información adicional**
  - Género
  - Fecha de nacimiento
  - Ubicación
  - Sitio web
  - Redes sociales (Twitter, Discord, etc.)

- **Privacidad**
  - Configuración de perfil privado/público
  - Control de visibilidad de listas
  - Control de visibilidad de favoritos

### Gestión de Cuenta
- **Cambio de contraseña**
  - Verificación de contraseña actual
  - Validación de nueva contraseña
  - Hash seguro de nueva contraseña

- **Edición de perfil**
  - Actualización de display name
  - Actualización de avatar
  - Actualización de bio
  - Actualización de información personal
  - Actualización de redes sociales

- **Eliminación de cuenta**
  - Soft delete (marca deleted_at)
  - Preservación de datos para integridad referencial

---

## Sistema de Medios

### Tipos de Medios Soportados
1. **Anime**
2. **Manga**
3. **Novela** (Light novels, Web novels)
4. **Donghua** (Anime chino)
5. **Manhua** (Manga chino)
6. **Manhwa** (Manga coreano)
7. **Fan Comic** (Doujinshi, fan manga)

### Información de Medios

#### Datos Básicos
- Título (español, romaji, nativo, inglés)
- Slug único para URLs
- Imagen de portada
- Banner
- Sinopsis/descripción
- Tipo de medio
- Estado (En emisión, Finalizado, Proximamente, Cancelado)

#### Datos Específicos por Tipo

**Anime/Donghua:**
- Número de episodios
- Duración por episodio
- Formato (TV, OVA, ONA, Película, Especial)
- Temporada de emisión (Invierno, Primavera, Verano, Otoño)
- Año de emisión
- Estudio de animación
- Fuente original (Manga, Light Novel, Original, etc.)

**Manga/Manhua/Manhwa/Fan Comic:**
- Número de capítulos
- Número de volúmenes
- Fecha de inicio
- Fecha de finalización
- Tipo de serialización (Manga, Manhwa, Manhua, One-shot, Doujinshi)

**Novela:**
- Número de capítulos
- Número de volúmenes
- Fecha de inicio
- Fecha de finalización
- Tipo (Light Novel, Web Novel, Novela)

#### Clasificación y Categorización
- Géneros (múltiples): Acción, Romance, Comedia, Drama, etc.
- Temas (múltiples): Escolar, Militar, Histórico, etc.
- Rating de edad: G, PG, PG-13, R, R+, Rx
- Ranking general (calculado automáticamente)
- Popularidad (basada en usuarios que lo tienen en listas)

#### Multimedia
- **Trailers:** URLs de YouTube/Vimeo
- **Videos:** Clips, PVs, CMs
- **Imágenes:** Screenshots, posters, artwork

#### Relaciones
- **Relacionados:**
  - Secuela
  - Precuela
  - Historia paralela
  - Spin-off
  - Adaptación
  - Resumen
  - Personaje
  - Otra

- **Recomendaciones:** Medios similares sugeridos por usuarios

### Enlaces Oficiales
- Sitio web oficial
- Twitter oficial
- Sitio de streaming (Crunchyroll, Netflix, etc.)
- Otros enlaces relevantes

### Estadísticas de Medios
- Total de usuarios que lo tienen en listas
- Usuarios viéndolo actualmente
- Usuarios que lo completaron
- Usuarios que planean verlo
- Total de favoritos
- Puntuación promedio
- Distribución de puntuaciones

---

## Sistema de Listas de Usuario

### Listas Predeterminadas
Cada usuario tiene automáticamente 7 listas predeterminadas por tipo de medio:

**Para Anime/Donghua:**
1. Viendo (watching)
2. Completado (completed)
3. En espera (on_hold)
4. Abandonado (dropped)
5. Planeando ver (plan_to_watch)

**Para Manga/Manhua/Manhwa/Novela/Fan Comic:**
1. Leyendo (reading)
2. Completado (completed)
3. En espera (on_hold)
4. Abandonado (dropped)
5. Planeando leer (plan_to_read)

### Listas Personalizadas
- **Creación de listas custom**
  - Nombre personalizado
  - Descripción opcional
  - Tipo de medio específico
  - Visibilidad (pública/privada)

- **Gestión de listas**
  - Edición de nombre y descripción
  - Cambio de visibilidad
  - Eliminación de listas (soft delete)
  - Reordenamiento de items

### Items en Listas
- **Información del item:**
  - Estado (viendo, completado, etc.)
  - Puntuación personal (1-10)
  - Progreso (episodios/capítulos vistos)
  - Fecha de inicio
  - Fecha de finalización
  - Notas personales
  - Veces que lo ha visto/leído
  - Prioridad (baja, media, alta)

- **Actualización de progreso:**
  - Incremento automático de episodios/capítulos
  - Cambio de estado al completar
  - Actualización de fechas automática

### Privacidad de Listas
- Listas públicas: visibles para todos
- Listas privadas: solo visibles para el dueño
- Toggle rápido de privacidad

---

## Sistema de Favoritos

### Tipos de Favoritos
Los usuarios pueden agregar a favoritos:
1. **Anime**
2. **Manga**
3. **Novelas**
4. **Donghua**
5. **Manhua**
6. **Manhwa**
7. **Fan Comics**
8. **Personajes**
9. **Voice Actors (Actores de voz)**
10. **Staff (Personal)**

### Funcionalidades
- **Agregar a favoritos**
  - Botón visible en cada página de detalle
  - Incremento automático del contador
  - Actualización en tiempo real

- **Quitar de favoritos**
  - Soft delete (marca deleted_at)
  - Decremento automático del contador
  - Actualización en tiempo real

- **Visualización**
  - Sección de favoritos en perfil de usuario
  - Agrupación por tipo de medio
  - Contador visible en cada item

### Ranking de Favoritos
- Top personajes más favoritos
- Top voice actors más favoritos
- Top staff más favoritos
- Top medios más favoritos (por tipo)

---

## Sistema de Reseñas

### Creación de Reseñas
- **Tipos soportados:**
  - Anime
  - Manga
  - Novelas
  - Donghua
  - Manhua
  - Manhwa
  - Fan Comics

- **Campos de la reseña:**
  - Puntuación general (1-10) - **Obligatorio**
  - Puntuación de historia (1-10)
  - Puntuación de personajes (1-10)
  - Puntuación de arte/animación (1-10)
  - Puntuación de música/sonido (1-10)
  - Contenido de la reseña (texto) - **Obligatorio**
  - Indicador de spoilers

### Validaciones
- Usuario debe tener el medio en su lista
- Límite de caracteres: 100 mínimo, 10,000 máximo
- Una reseña por usuario por medio
- Puntuaciones deben estar entre 1 y 10

### Gestión de Reseñas
- **Edición**
  - Actualización de puntuaciones
  - Actualización de contenido
  - Cambio de indicador de spoilers

- **Eliminación**
  - Soft delete de reseñas
  - Preservación para historial

### Visualización
- Reseñas en página de detalle del medio
- Ordenamiento por fecha o puntuación
- Filtrado por puntuación mínima
- Indicador visual de spoilers
- Perfil del autor visible

### Sistema de Utilidad
- Usuarios pueden marcar reseñas como útiles
- Contador de utilidad visible
- Ordenamiento por utilidad

---

## Sistema de Comentarios

### Comentarios en Entidades
Los comentarios están disponibles en:
1. **Anime**
2. **Manga**
3. **Novelas**
4. **Donghua**
5. **Manhua**
6. **Manhwa**
7. **Fan Comics**
8. **Personajes**
9. **Voice Actors**
10. **Staff**

### Funcionalidades de Comentarios

#### Publicación
- **Comentario principal**
  - Contenido de texto (obligatorio)
  - Indicador de spoiler (opcional)
  - Hasta 4 imágenes adjuntas (opcional)
  - Límite de 5000 caracteres

- **Respuestas anidadas**
  - Responder a cualquier comentario
  - Hilos de conversación
  - Carga diferida (lazy loading) de respuestas
  - Indicador de cantidad de respuestas

#### Interacciones
- **Sistema de Likes**
  - Like/Unlike en comentarios
  - Contador de likes visible
  - Estado visual para el usuario (corazón rojo si le gustó)
  - Notificación al autor del comentario

- **Edición de comentarios**
  - Solo el autor puede editar
  - Indicador visual de "editado"
  - Historial de última edición

- **Eliminación de comentarios**
  - Soft delete
  - Solo el autor puede eliminar sus propios comentarios
  - Admins y moderadores pueden eliminar cualquier comentario

#### Spoilers
- **Ocultamiento automático**
  - Comentarios marcados como spoiler se muestran ocultos
  - Botón "Click para revelar"
  - Badge visual de "Spoiler"

- **Control de revelación**
  - El usuario decide cuándo ver spoilers
  - Estado persistente durante la sesión

#### Sistema de Reportes
- **Reportar comentarios**
  - Botón "Reportar" en menú de opciones
  - Razón del reporte (mínimo 10 caracteres)
  - No se puede reportar el propio comentario
  - Prevención de reportes duplicados

- **Gestión de reportes**
  - Panel de moderación exclusivo
  - Estados: Pendiente, Resuelto, Desestimado
  - Vista de contexto completo
  - Acciones rápidas: Eliminar comentario, Desestimar reporte

### Ordenamiento
- Más recientes primero
- Más antiguos primero
- Más populares (por likes)

### Notificaciones
- Notificación cuando alguien responde a tu comentario
- Notificación cuando alguien le da like a tu comentario
- Notificación a moderadores cuando se reporta un comentario

---

## Sistema de Contribuciones

### Tipos de Contribuciones
Los usuarios pueden contribuir agregando:

1. **Anime**
2. **Manga**
3. **Novelas**
4. **Donghua**
5. **Manhua**
6. **Manhwa**
7. **Fan Comics**
8. **Personajes**
9. **Voice Actors**
10. **Staff**
11. **Relaciones entre personajes y medios**
12. **Relaciones entre staff y medios**

### Proceso de Contribución

#### Envío
- **Formulario de contribución**
  - Campos específicos por tipo de entidad
  - Validaciones en tiempo real
  - Soporte para imágenes (URLs)
  - Información completa requerida

- **Estado inicial**
  - Todas las contribuciones comienzan como "Pendiente"
  - Contador de contribuciones del usuario
  - Registro de timestamp

#### Revisión (Moderación)
- **Panel de moderación**
  - Vista de contribuciones pendientes
  - Información completa visible
  - Acciones disponibles: Aprobar, Rechazar

- **Aprobación**
  - Creación de la entidad en la base de datos
  - Otorgamiento de puntos al contribuidor (5 puntos)
  - Incremento del contador de contribuciones aprobadas
  - Notificación al usuario

- **Rechazo**
  - Razón de rechazo obligatoria
  - Notificación al usuario con la razón
  - Contribución marcada como rechazada
  - Sin otorgamiento de puntos

### Centro de Contribución
- **Página dedicada** (`/contribution-center`)
  - Formularios organizados por tipo
  - Historial de contribuciones del usuario
  - Estado de cada contribución
  - Puntos ganados por contribuciones

### Recompensas
- **5 puntos** por contribución aprobada
- **Contador público** de contribuciones aprobadas
- **Badge de contribuidor** en perfil (si tiene contribuciones)

---

## Sistema de Notificaciones

### Tipos de Notificaciones

#### Interacciones Sociales
1. **Comentario respondido** (`comment_reply`)
   - Alguien respondió a tu comentario
   - Link directo al comentario

2. **Comentario likeado** (`comment_like`)
   - Alguien le dio like a tu comentario
   - Link directo al comentario

#### Contribuciones
3. **Contribución aprobada** (`contribution_approved`)
   - Tu contribución fue aprobada
   - Puntos ganados
   - Link a la entidad creada

4. **Contribución rechazada** (`contribution_rejected`)
   - Tu contribución fue rechazada
   - Razón del rechazo
   - Link a la contribución

#### Moderación
5. **Comentario reportado** (`comment_reported`)
   - Un comentario fue reportado (solo admins/mods)
   - Link al panel de reportes
   - Información del reportante

### Funcionalidades

#### Visualización
- **Botón de notificaciones**
  - Badge con contador de no leídas
  - Dropdown con últimas notificaciones
  - Indicador visual de no leídas

- **Centro de notificaciones**
  - Lista completa de notificaciones
  - Ordenadas por fecha
  - Paginación

#### Gestión
- **Marcar como leída**
  - Individual
  - Todas a la vez
  - Actualización en tiempo real

- **Eliminación**
  - Soft delete de notificaciones antiguas
  - Limpieza automática (opcional)

#### Tiempo Real
- Polling cada 30 segundos (configurable)
- Actualización automática del contador
- Sonido/vibración al recibir nueva notificación (opcional)

---

## Sistema de Moderación

### Roles y Permisos

#### Admin
Permisos completos:
- Aprobar/rechazar contribuciones
- Eliminar cualquier comentario
- Ver y gestionar reportes
- Eliminar cualquier reseña
- Banear usuarios
- Gestionar roles de usuarios
- Acceso al panel de administración completo

#### Moderador
Permisos limitados:
- Aprobar/rechazar contribuciones
- Eliminar cualquier comentario
- Ver y gestionar reportes
- Eliminar reseñas inapropiadas
- Acceso al panel de moderación

#### Usuario Regular
Permisos básicos:
- Editar/eliminar solo sus propias contribuciones
- Editar/eliminar solo sus propios comentarios
- Reportar contenido inapropiado

### Panel de Moderación

#### Dashboard de Contribuciones
**Ruta:** `/dashboard/moderator/contributions` o `/dashboard/admin/contributions`

Funcionalidades:
- Vista de contribuciones pendientes
- Filtros por tipo de contribución
- Información completa de cada contribución
- Botones de acción: Aprobar, Rechazar
- Diálogo de rechazo con campo de razón
- Estadísticas de contribuciones

#### Dashboard de Reportes
**Ruta:** `/dashboard/moderator/reported-comments` o `/dashboard/admin/reported-comments`

Funcionalidades:
- **Tabs de estado:**
  - Pendientes
  - Resueltos
  - Desestimados

- **Información mostrada:**
  - Razón del reporte
  - Quién reportó
  - Contenido del comentario reportado
  - Autor del comentario
  - Tipo de entidad
  - Timestamps

- **Acciones disponibles:**
  - Eliminar comentario y marcar como resuelto
  - Desestimar reporte (mantener comentario)
  - Ver contexto (abre página en nueva pestaña)

#### Notificaciones para Moderadores
- Notificación inmediata cuando se reporta contenido
- Badge en el icono de notificaciones
- Link directo al panel de reportes

### Herramientas de Moderación

#### Gestión de Comentarios
- Ver todos los comentarios de un usuario
- Eliminar comentarios en masa
- Banear usuario de comentar (futuro)

#### Gestión de Contribuciones
- Historial de contribuciones por usuario
- Estadísticas de aprobación/rechazo
- Identificar contribuidores problemáticos

#### Sistema de Reportes
- Dashboard centralizado
- Categorización de reportes
- Historial de resoluciones
- Estadísticas de moderación

---

## Sistema de Ranking y Estadísticas

### Rankings Globales

#### Top Medios
- **Ranking general**
  - Calculado por puntuación promedio
  - Mínimo de usuarios requeridos
  - Actualización en tiempo real

- **Por popularidad**
  - Basado en cantidad de usuarios en listas
  - Tendencias actuales
  - Más agregados recientemente

#### Top Personajes
- **Por favoritos**
  - Personajes más agregados a favoritos
  - Contador público
  - Imágenes y nombres

- **Por apariciones**
  - Personajes que aparecen en más medios
  - Roles principales vs secundarios

#### Top Usuarios Activos
- **Cálculo de actividad:**
  - Contribuciones aprobadas: **peso 5**
  - Items en listas: **peso 1**
  - Reseñas escritas: **peso 3**

- **Información mostrada:**
  - Display name y avatar
  - Nivel actual
  - Puntuación de actividad total
  - Desglose por tipo de medio:
    - A: Anime
    - M: Manga
    - N: Novela
    - D: Donghua
    - MH: Manhua
    - MW: Manhwa
    - FC: Fan Comic

#### Top Voice Actors
- Por favoritos
- Por cantidad de roles
- Por popularidad de personajes interpretados

#### Top Staff
- Por favoritos
- Por cantidad de trabajos
- Por popularidad de obras

### Estadísticas de Medios

#### Datos Generales
- Total de usuarios con el medio en listas
- Distribución por estado:
  - Viéndolo/Leyéndolo
  - Completado
  - En espera
  - Abandonado
  - Planeando ver/leer

#### Puntuaciones
- Promedio general
- Distribución de puntuaciones (1-10)
- Tendencia en el tiempo
- Comparación con medios similares

#### Popularidad
- Posición en ranking general
- Tendencia de popularidad
- Picos de actividad
- Comparación con temporada/año

### Estadísticas de Usuario

#### Perfil Personal
- Total de medios en listas (por tipo)
- Episodios/Capítulos vistos/leídos
- Días invertidos
- Puntuación promedio otorgada
- Distribución de puntuaciones

#### Historial
- Actividad por fecha
- Medios completados por mes
- Evolución de gustos
- Géneros favoritos

---

## Sistema de Personajes y Personal

### Personajes

#### Información de Personajes
- **Datos básicos:**
  - Nombre (español, romaji, nativo)
  - Slug único
  - Imagen del personaje
  - Descripción/biografía
  - Contador de favoritos

- **Datos adicionales:**
  - Género
  - Edad
  - Tipo de sangre
  - Fecha de nacimiento
  - Altura, peso (opcional)

#### Relaciones con Medios
- **Apariciones:**
  - Medio donde aparece
  - Rol (Principal, Secundario, Apoyo)
  - Link al medio

- **Voice Actors:**
  - Actor de voz japonés
  - Actor de voz español (doblaje latinoamericano)
  - Otros idiomas
  - Link a perfil del voice actor

#### Página de Personaje
**Ruta:** `/character/[slug]`

Contenido:
- Imagen y nombre completo
- Descripción
- Lista de medios donde aparece
- Voice actors que lo interpretan
- Estadísticas de favoritos
- Botón de agregar a favoritos
- **Sección de comentarios**

### Voice Actors (Actores de Voz)

#### Información
- **Datos básicos:**
  - Nombre (romaji, nativo)
  - Slug único
  - Imagen/foto
  - Biografía
  - Idioma principal (Japonés, Español, etc.)
  - Contador de favoritos

- **Datos adicionales:**
  - Género
  - Fecha de nacimiento
  - Tipo de sangre
  - Lugar de origen
  - Sitio web oficial
  - Redes sociales

#### Roles Interpretados
- **Lista de personajes:**
  - Personaje interpretado
  - Medio del personaje
  - Rol del personaje
  - Link a personaje y medio

#### Página de Voice Actor
**Ruta:** `/voice-actor/[slug]`

Contenido:
- Foto y nombre completo
- Biografía
- Idioma principal
- Lista de roles interpretados
- Estadísticas de favoritos
- Botón de agregar a favoritos
- **Sección de comentarios**

### Staff (Personal de Producción)

#### Información
- **Datos básicos:**
  - Nombre (romaji, nativo)
  - Slug único
  - Imagen/foto
  - Biografía
  - Ocupaciones principales (Director, Escritor, etc.)
  - Contador de favoritos

- **Datos adicionales:**
  - Género
  - Fecha de nacimiento
  - Lugar de origen
  - Años activo

#### Trabajos Realizados
- **Lista de obras:**
  - Medio en el que trabajó
  - Rol (Director, Escritor, Diseñador, etc.)
  - Año
  - Link al medio

#### Página de Staff
**Ruta:** `/staff/[slug]`

Contenido:
- Foto y nombre completo
- Biografía
- Ocupaciones principales
- Lista de trabajos agrupados por rol
- Estadísticas de favoritos
- Botón de agregar a favoritos
- **Sección de comentarios**

---

## Sistema de Puntos y Niveles

### Obtención de Puntos

#### Acciones que Otorgan Puntos
1. **Comentar en medios/personajes/staff**
   - Puntos: Configurables en tabla `action_points`
   - Solo comentarios principales (no respuestas)

2. **Agregar item a lista**
   - Puntos: Configurables en tabla `action_points`
   - Por cada medio agregado a cualquier lista

3. **Escribir reseña**
   - Puntos: Configurables en tabla `action_points`
   - Reseña debe cumplir requisitos mínimos

4. **Contribución aprobada**
   - Puntos: **5 puntos fijos**
   - Solo cuando el moderador aprueba
   - Por cada contribución aprobada

### Sistema de Niveles

#### Cálculo de Nivel
El nivel se calcula automáticamente basado en los puntos totales:
```
Nivel = floor(sqrt(puntos / 100)) + 1
```

#### Rangos Aproximados
- **Nivel 1:** 0-99 puntos
- **Nivel 2:** 100-399 puntos
- **Nivel 3:** 400-899 puntos
- **Nivel 4:** 900-1599 puntos
- **Nivel 5:** 1600-2499 puntos
- Y así sucesivamente...

#### Actualización Automática
- Triggers de base de datos actualizan el nivel automáticamente
- Visible en:
  - Perfil de usuario
  - Comentarios
  - Listas públicas
  - Rankings

### Función de Otorgamiento
**Función:** `fn_award_points()`

Parámetros:
- `user_id`: ID del usuario
- `points`: Cantidad de puntos a otorgar
- `action_name`: Nombre de la acción
- `related_entity_type`: Tipo de entidad relacionada
- `related_entity_id`: ID de la entidad relacionada

Proceso:
1. Suma los puntos al total del usuario
2. Incrementa el contador de contribuciones (si aplica)
3. Recalcula el nivel automáticamente
4. Actualiza timestamp de última actividad

### Tabla de Acciones y Puntos
Configuración en tabla `app.action_points`:

| Acción | Puntos | Descripción |
|--------|--------|-------------|
| comment_on_media | Variable | Comentar en medios |
| add_to_list | Variable | Agregar a lista |
| write_review | Variable | Escribir reseña |
| approve_contribution | 5 | Contribución aprobada |

### Visualización de Progreso
- Badge de nivel en perfil
- Barra de progreso al siguiente nivel
- Puntos totales visibles
- Historial de puntos ganados (futuro)

---

## Búsqueda y Descubrimiento

### Sistema de Búsqueda
**Ruta:** `/search`

#### Búsqueda General
- Input de búsqueda global
- Búsqueda en múltiples tipos:
  - Anime
  - Manga
  - Novelas
  - Donghua
  - Manhua
  - Manhwa
  - Fan Comics
  - Personajes
  - Voice Actors
  - Staff

#### Filtros Avanzados
- **Por tipo de medio**
- **Por estado** (En emisión, Finalizado, etc.)
- **Por formato** (TV, Película, OVA, etc.)
- **Por género/tema**
- **Por año**
- **Por temporada**
- **Por puntuación**
- **Por popularidad**

#### Ordenamiento
- Relevancia
- Puntuación
- Popularidad
- Alfabético
- Fecha de estreno
- Recién agregados

### Descubrimiento

#### Recomendaciones
- Basadas en listas del usuario
- Basadas en géneros favoritos
- Sugerencias de la comunidad
- Tendencias actuales

#### Top Rankings
- Top semanal
- Top mensual
- Top de temporada
- Top de año
- Top de todos los tiempos

#### Exploración por Géneros
- Grid de géneros
- Cantidad de medios por género
- Filtros combinables

---

Esta documentación cubre todas las funcionalidades principales implementadas en el proyecto Chirisu. Cada sección puede expandirse con más detalles técnicos según sea necesario.
