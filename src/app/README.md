# 📁 Estructura de Rutas - Chirisu

Documentación completa de la arquitectura de páginas y rutas del proyecto Chirisu.
Basado en Next.js 15 App Router con estructura de carpetas como rutas.

---

## 📂 Estructura General

```
src/app/
├── 🏠 page.tsx              # Página principal
├── 🎨 layout.tsx            # Layout raíz
├── 🎭 globals.css           # Estilos globales
│
├── 📺 anime/                # Catálogo y páginas de anime
├── 📖 manga/                # Catálogo y páginas de manga
├── 📚 novela/               # Catálogo y páginas de novelas
├── 🎬 donghua/              # Catálogo y páginas de donghua
├── 📕 manhua/               # Catálogo y páginas de manhua
├── 📗 manhwa/               # Catálogo y páginas de manhwa
├── 🎨 fan-comic/            # Catálogo y páginas de fan comics
│
├── 👤 character/            # Páginas de personajes
├── 👥 characters/           # Listado de personajes
├── 🎤 voice-actor/          # Páginas de actores de voz
├── 🎤 voice-actors/         # Listado de actores de voz
├── 👔 staff/                # Páginas y listado de staff
├── 🎬 episode/              # Páginas de episodios
│
├── 🔐 login/                # Inicio de sesión
├── 📝 register/             # Registro de usuarios
├── 🔑 recover-password/     # Recuperación de contraseña
├── 🔒 setup-2fa/            # Configuración 2FA
│
├── 👤 profile/              # Perfil del usuario actual
├── 🌐 u/                    # Perfiles públicos (/u/username)
│
├── 🔍 search/               # Búsqueda global
├── ✨ contribution-center/  # Centro de contribuciones
├── 🛡️ dashboard/            # Dashboards (admin/moderador)
│
├── 📝 edit/                 # Edición (vacía - migrado)
└── 🔌 api/                  # API Routes (documentado aparte)
```

---

## 🏠 Raíz de la Aplicación

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `page.tsx` | `/` | Página principal con carruseles, rankings y contenido destacado |
| `layout.tsx` | - | Layout raíz: ThemeProvider, AuthContext, Toaster, MainNav, Footer |
| `globals.css` | - | Estilos globales Tailwind + variables CSS del tema |

---

## 📺 Catálogos de Medios

Todas las secciones de medios siguen la misma estructura:

```
[media-type]/
├── page.tsx          # Catálogo con filtros
└── [id]/
    └── page.tsx      # Página detallada del medio
```

### Rutas disponibles:

| Carpeta | Rutas | Descripción |
|---------|-------|-------------|
| `anime/` | `/anime`, `/anime/[id]` | Catálogo y detalle de anime |
| `manga/` | `/manga`, `/manga/[id]` | Catálogo y detalle de manga |
| `novela/` | `/novela`, `/novela/[id]` | Catálogo y detalle de novelas ligeras |
| `donghua/` | `/donghua`, `/donghua/[id]` | Catálogo y detalle de animación china |
| `manhua/` | `/manhua`, `/manhua/[id]` | Catálogo y detalle de comics chinos |
| `manhwa/` | `/manhwa`, `/manhwa/[id]` | Catálogo y detalle de comics coreanos |
| `fan-comic/` | `/fan-comic`, `/fan-comic/[id]` | Catálogo y detalle de fan comics |

### Características de páginas de catálogo:
- Grid de medios con lazy loading
- Filtros: género, año, estado, formato, orden
- Paginación infinita o por páginas
- Vista lista/grid

### Características de páginas de detalle:
- Tema dinámico basado en portada
- Información completa (sinopsis, detalles, stats)
- Tabs: Episodios, Personajes, Staff, Reseñas
- Acciones: Agregar a lista, favoritos, reseñar
- Recomendaciones y relacionados

---

## 👥 Entidades (Personajes, Staff, Actores)

### `character/` - Páginas de Personajes

```
character/
└── [slug]/
    ├── page.tsx          # Página del personaje
    └── page-new.tsx      # Nueva versión (en desarrollo)
```

| Ruta | Descripción |
|------|-------------|
| `/character/[slug]` | Detalle de personaje con actores de voz y apariciones |

### `characters/` - Listado de Personajes

```
characters/
└── page.tsx              # Listado/búsqueda de personajes
```

| Ruta | Descripción |
|------|-------------|
| `/characters` | Catálogo de todos los personajes |

### `voice-actor/` - Páginas de Actores de Voz

```
voice-actor/
└── [slug]/
    ├── page.tsx          # Página del actor de voz
    └── page-new.tsx      # Nueva versión (en desarrollo)
```

| Ruta | Descripción |
|------|-------------|
| `/voice-actor/[slug]` | Detalle con roles interpretados |

### `voice-actors/` - Listado de Actores

```
voice-actors/
└── page.tsx              # Listado de actores de voz
```

| Ruta | Descripción |
|------|-------------|
| `/voice-actors` | Catálogo de actores de voz |

### `staff/` - Páginas de Staff

```
staff/
├── page.tsx              # Listado de staff
└── [slug]/
    └── page.tsx          # Detalle de persona
```

| Ruta | Descripción |
|------|-------------|
| `/staff` | Catálogo de directores, escritores, etc. |
| `/staff/[slug]` | Detalle con trabajos realizados |

### `episode/` - Páginas de Episodios

```
episode/
└── [id]/
    └── page.tsx          # Página del episodio
```

| Ruta | Descripción |
|------|-------------|
| `/episode/[id]` | Detalle de episodio con info y comentarios |

---

## 🔐 Autenticación

### `login/` - Inicio de Sesión

```
login/
└── page.tsx
```

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario de login con Google OAuth |

**Características:**
- Login con email/password
- Login con Google
- Verificación 2FA si está activo
- Enlace a registro y recuperación

### `register/` - Registro

```
register/
└── page.tsx
```

| Ruta | Descripción |
|------|-------------|
| `/register` | Formulario de registro de cuenta |

**Características:**
- Registro con email
- Validación de campos
- Verificación de email (opcional)
- Enlace a login

### `recover-password/` - Recuperación de Contraseña

```
recover-password/
└── page.tsx
```

| Ruta | Descripción |
|------|-------------|
| `/recover-password` | Recuperar contraseña con token |

**Características:**
- Recibe token desde email
- Formulario para nueva contraseña
- Validación de fortaleza

### `setup-2fa/` - Configuración 2FA

```
setup-2fa/
└── page.tsx
```

| Ruta | Descripción |
|------|-------------|
| `/setup-2fa` | Página de configuración inicial 2FA |

**Características:**
- Mostrar QR code
- Códigos de respaldo
- Verificación de código TOTP

---

## 👤 Perfil de Usuario

### `profile/` - Perfil del Usuario Actual

```
profile/
├── page.tsx              # Vista principal del perfil
├── edit/
│   └── page.tsx          # Editar perfil
├── notifications/
│   └── page.tsx          # Historial de notificaciones
├── reports/
│   └── page.tsx          # Mis reportes enviados
└── user/
    ├── page.tsx          # Redirección
    └── [username]/
        └── page.tsx      # Ver perfil de otro usuario
```

| Ruta | Descripción |
|------|-------------|
| `/profile` | Mi perfil (requiere auth) |
| `/profile/edit` | Editar mi perfil |
| `/profile/notifications` | Historial completo de notificaciones |
| `/profile/reports` | Reportes que he enviado |
| `/profile/user/[username]` | Ver perfil de otro usuario |

### `u/` - Perfiles Públicos (URL corta)

```
u/
└── [username]/
    └── page.tsx          # Perfil público
```

| Ruta | Descripción |
|------|-------------|
| `/u/[username]` | Perfil público de usuario (URL amigable) |

**Ejemplo:** `/u/otaku123` → Perfil de otaku123

---

## 🔍 Búsqueda

### `search/` - Búsqueda Global

```
search/
└── page.tsx
```

| Ruta | Descripción |
|------|-------------|
| `/search` | Búsqueda global con filtros |
| `/search?q=naruto` | Búsqueda con query |
| `/search?q=naruto&type=anime` | Filtrado por tipo |

**Características:**
- Búsqueda en tiempo real
- Filtros por tipo de media
- Resultados categorizados
- Autocompletado

---

## ✨ Centro de Contribuciones

Sistema para que usuarios contribuyan contenido nuevo o editen existente.

### Formularios Utilizados:

| Formulario | Tipos de Media | Características |
|------------|----------------|-----------------|
| `AnimeContributionForm` | Anime, Donghua | Episodios individuales, estudios, personajes con VA, enlaces (3 tipos) |
| `ContributionForm` | Manga, Manhwa, Manhua, Novela, Fan Comic | Volúmenes, capítulos, editoriales, staff, personajes |

### Estructura completa:

```
contribution-center/
├── layout.tsx                    # Layout con sidebar
├── page.tsx                      # Dashboard de contribuciones
├── add/
│   └── page.tsx                  # Selector de tipo a agregar
│
│   # === FORMULARIO: AnimeContributionForm ===
├── add-anime/
│   └── page.tsx                  # → AnimeContributionForm (anime)
├── add-dougua/
│   └── page.tsx                  # → AnimeContributionForm (donghua)
│
│   # === FORMULARIO: ContributionForm ===
├── add-manga/
│   └── page.tsx                  # → ContributionForm (manga)
├── add-manhwa/
│   └── page.tsx                  # → ContributionForm (manhwa)
├── add-manhua/
│   └── page.tsx                  # → ContributionForm (manhua)
├── add-novela/
│   └── page.tsx                  # → ContributionForm (novela)
├── add-fan-comic/
│   └── page.tsx                  # → ContributionForm (fan_comic)
│
│   # === ENTIDADES ===
├── add-character/
│   └── page.tsx                  # Agregar nuevo personaje
├── add-voice-actor/
│   └── page.tsx                  # Agregar nuevo actor de voz
├── add-staff/
│   └── page.tsx                  # Agregar nuevo staff
├── add-studio/
│   └── page.tsx                  # Agregar nuevo estudio
├── add-genre/
│   └── page.tsx                  # Agregar nuevo género
└── edit/
    └── [mediaType]/
        └── [slug]/
            └── page.tsx          # Editar media existente
```

### Rutas de creación:

#### 🎬 Anime/Donghua (AnimeContributionForm):
| Ruta | Componente | Características |
|------|------------|-----------------|
| `/contribution-center/add-anime` | `AnimeContributionForm` | Episodios, estudios, VA japonés/español |
| `/contribution-center/add-dougua` | `AnimeContributionForm` | Episodios, estudios, VA chino/español |

#### 📖 Manga/Lectura (ContributionForm):
| Ruta | Componente | Características |
|------|------------|-----------------|
| `/contribution-center/add-manga` | `ContributionForm` | Volúmenes, capítulos, editoriales |
| `/contribution-center/add-manhwa` | `ContributionForm` | Volúmenes, capítulos, editoriales |
| `/contribution-center/add-manhua` | `ContributionForm` | Volúmenes, capítulos, editoriales |
| `/contribution-center/add-novela` | `ContributionForm` | Volúmenes, capítulos, editoriales |
| `/contribution-center/add-fan-comic` | `ContributionForm` | Volúmenes, capítulos, editoriales |

#### 👤 Entidades:
| Ruta | Descripción |
|------|-------------|
| `/contribution-center/add-character` | Formulario para nuevo personaje |
| `/contribution-center/add-voice-actor` | Formulario para nuevo actor |
| `/contribution-center/add-staff` | Formulario para nuevo staff |
| `/contribution-center/add-studio` | Formulario para nuevo estudio |
| `/contribution-center/add-genre` | Formulario para nuevo género |

### Rutas de edición:

| Ruta | Descripción |
|------|-------------|
| `/contribution-center/edit/[mediaType]/[slug]` | Editar contenido existente |

**Ejemplos:**
- `/contribution-center/edit/anime/naruto` → Editar Naruto
- `/contribution-center/edit/manga/one-piece` → Editar One Piece

---

## 🛡️ Dashboards de Administración

### Estructura completa:

```
dashboard/
├── layout.tsx                    # Layout compartido
├── admin/                        # Panel de administrador
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard principal
│   ├── search/
│   │   └── page.tsx              # Búsqueda de contenido
│   ├── edit/
│   │   └── [type]/
│   │       └── [id]/
│   │           └── page.tsx      # Editar cualquier contenido
│   ├── moderation/
│   │   └── page.tsx              # Panel de moderación
│   ├── reports/
│   │   ├── page.tsx              # Reportes de contribuciones
│   │   └── [id]/
│   │       └── page.tsx          # Detalle de reporte
│   ├── reported-comments/
│   │   └── page.tsx              # Comentarios reportados
│   └── top-contributors/
│       └── page.tsx              # Top contribuidores
│
└── moderator/                    # Panel de moderador
    ├── layout.tsx
    ├── page.tsx                  # Dashboard principal
    ├── contributions/
    │   ├── page.tsx              # Lista de contribuciones
    │   ├── [id]/
    │   │   └── page.tsx          # Revisar contribución
    │   └── edit/
    │       └── [id]/
    │           └── page.tsx      # Editar contribución
    ├── reports/
    │   ├── page.tsx              # Reportes asignados
    │   └── [id]/
    │       └── page.tsx          # Detalle de reporte
    ├── reported-comments/
    │   └── page.tsx              # Comentarios reportados
    ├── reported-reviews/
    │   └── page.tsx              # Reviews reportadas
    └── reported-users/
        └── page.tsx              # Usuarios reportados
```

### Panel de Administrador (`/dashboard/admin/`)

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/dashboard/admin` | Dashboard principal | Admin |
| `/dashboard/admin/search` | Buscar cualquier contenido | Admin |
| `/dashboard/admin/edit/[type]/[id]` | Editar directamente (sin contribución) | Admin |
| `/dashboard/admin/moderation` | Panel de moderación general | Admin |
| `/dashboard/admin/reports` | Todas las contribuciones | Admin |
| `/dashboard/admin/reports/[id]` | Detalle de contribución | Admin |
| `/dashboard/admin/reported-comments` | Comentarios reportados | Admin |
| `/dashboard/admin/top-contributors` | Ranking de contribuidores | Admin |

**Características del Admin:**
- ✅ Ve TODAS las contribuciones (cualquier estado)
- ✅ Puede editar contenido directamente
- ✅ Puede aprobar/rechazar contribuciones
- ✅ Puede asignar/reasignar moderadores
- ✅ Acceso a estadísticas completas

### Panel de Moderador (`/dashboard/moderator/`)

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/dashboard/moderator` | Dashboard principal | Moderador |
| `/dashboard/moderator/contributions` | Contribuciones disponibles | Moderador |
| `/dashboard/moderator/contributions/[id]` | Revisar contribución | Moderador |
| `/dashboard/moderator/contributions/edit/[id]` | Editar contribución | Moderador |
| `/dashboard/moderator/reports` | Reportes de contenido | Moderador |
| `/dashboard/moderator/reports/[id]` | Detalle de reporte | Moderador |
| `/dashboard/moderator/reported-comments` | Comentarios reportados | Moderador |
| `/dashboard/moderator/reported-reviews` | Reviews reportadas | Moderador |
| `/dashboard/moderator/reported-users` | Usuarios reportados | Moderador |

**Características del Moderador:**
- ✅ Ve contribuciones: sin asignar + asignadas a él + abandonadas
- ✅ Puede "tomar" un caso (asignárselo)
- ✅ Puede "liberar" un caso que tomó
- ✅ Puede aprobar/rechazar contribuciones
- ❌ NO puede editar contenido directamente
- ❌ NO ve contribuciones de otros moderadores

---

## 🔄 Flujo de Navegación

### Usuario Regular:

```
/ (Home)
├── /anime (Catálogo)
│   └── /anime/123 (Detalle)
│       └── /contribution-center/edit/anime/123 (Editar)
├── /profile (Mi perfil)
│   └── /profile/notifications
└── /u/username (Perfil público)
```

### Contribuidor:

```
/contribution-center (Dashboard)
├── /contribution-center/add (Selector)
│   ├── /contribution-center/add-anime
│   ├── /contribution-center/add-manga
│   └── ...
└── /contribution-center/edit/[type]/[slug]
```

### Moderador:

```
/dashboard/moderator (Dashboard)
├── /dashboard/moderator/contributions
│   └── /dashboard/moderator/contributions/[id]
├── /dashboard/moderator/reported-comments
├── /dashboard/moderator/reported-reviews
└── /dashboard/moderator/reported-users
```

### Administrador:

```
/dashboard/admin (Dashboard)
├── /dashboard/admin/search
├── /dashboard/admin/edit/[type]/[id]
├── /dashboard/admin/reports
│   └── /dashboard/admin/reports/[id]
├── /dashboard/admin/moderation
└── /dashboard/admin/top-contributors
```

---

## 🔐 Control de Acceso

| Ruta | Público | Usuario | Moderador | Admin |
|------|:-------:|:-------:|:---------:|:-----:|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/anime`, `/manga`, etc. | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/register` | ✅ | ❌ | ❌ | ❌ |
| `/profile` | ❌ | ✅ | ✅ | ✅ |
| `/u/[username]` | ✅ | ✅ | ✅ | ✅ |
| `/contribution-center` | ❌ | ✅ | ✅ | ✅ |
| `/dashboard/moderator` | ❌ | ❌ | ✅ | ✅ |
| `/dashboard/admin` | ❌ | ❌ | ❌ | ✅ |

---

## 📊 Estadísticas de Rutas

| Sección | Rutas |
|---------|-------|
| Catálogos de medios | 14 |
| Entidades (personajes, staff) | 8 |
| Autenticación | 4 |
| Perfil de usuario | 6 |
| Centro de contribuciones | 15 |
| Dashboard Admin | 8 |
| Dashboard Moderador | 9 |
| Otros (search) | 1 |

**Total: ~65 rutas**

---

## 📝 Convenciones

### Nomenclatura de carpetas:
- `kebab-case` para rutas → `contribution-center`
- `[param]` para rutas dinámicas → `[id]`, `[slug]`
- `[...slug]` para catch-all (no usado actualmente)

### Archivos especiales Next.js:
- `page.tsx` - Componente de página
- `layout.tsx` - Layout compartido
- `loading.tsx` - Estado de carga (Suspense)
- `error.tsx` - Manejo de errores
- `not-found.tsx` - Página 404

### Estructura de página típica:
```tsx
// Metadata
export const metadata = { title: '...' };

// Server Component
export default async function Page({ params, searchParams }) {
  // Fetch data server-side
  const data = await getData(params.id);
  
  return <ClientComponent data={data} />;
}
```

---

## 🚀 Próximos Pasos

- [ ] Agregar `loading.tsx` a rutas principales
- [ ] Implementar `not-found.tsx` personalizado
- [ ] Agregar páginas de error personalizadas
- [ ] Implementar streaming con Suspense
- [ ] Agregar intercept routes para modales

---

**Última actualización:** 25 de Noviembre, 2025  
**Autor:** Equipo Chirisu
