# 📁 Estructura de Componentes - Chirisu

Reorganización de componentes por funcionalidad para mejor mantenibilidad y escalabilidad.

## 📂 Estructura General

```
src/components/
├── layout/              # Navegación, Footer, Tema
├── auth/                # Autenticación y sesión
├── media/               # Páginas de información de medios
├── catalog/             # Listados y búsquedas
├── rankings/            # Rankings y tops
├── user/                # Perfil y datos de usuario
├── lists/               # Listas personalizadas
├── reviews/             # Sistema de reseñas
├── comments/            # Sistema de comentarios
├── contributions/       # Contribuciones de usuarios
├── moderation/          # Herramientas de moderación
├── shared/              # Componentes reutilizables
└── ui/                  # Componentes base (shadcn/ui)
```

## 📖 Descripción de Carpetas

### `layout/` - Componentes de Diseño
Componentes que definen la estructura general de la aplicación.

**Componentes:**
- `main-nav.tsx` - Barra de navegación principal
- `footer.tsx` - Pie de página
- `breadcrumbs.tsx` - Navegación de migas de pan
- `theme-provider.tsx` - Proveedor de tema (claro/oscuro/dinámico)
- `theme-toggle.tsx` - Selector de tema
- `dynamic-theme.tsx` - Tema dinámico basado en imagen

**Uso:**
```tsx
import { MainNav, Footer, DynamicTheme } from '@/components/layout';
```

---

### `auth/` - Autenticación
Componentes relacionados con autenticación y gestión de cuenta.

**Componentes actuales:**
- `change-password-dialog.tsx` - Diálogo para cambiar contraseña

**Componentes futuros:**
- `login-form.tsx` - Formulario de inicio de sesión
- `register-form.tsx` - Formulario de registro
- `forgot-password-dialog.tsx` - Recuperación de contraseña
- `google-auth-button.tsx` - Botón de autenticación con Google
- `verify-email.tsx` - Verificación de email

**Uso:**
```tsx
import { ChangePasswordDialog } from '@/components/auth';
```

---

### `media/` - Información de Medios
Componentes para mostrar información detallada de anime, manga, novelas, etc.

**Subcarpetas:**
- `pages/` - Páginas completas de medios
- `cards/` - Tarjetas de información específica
- `displays/` - Componentes de visualización de datos

**Componentes de `pages/`:**
- `media-page.tsx` - Plantilla base de página de medios
- `media-page-client.tsx` - Versión cliente de página de medios
- `anime-page-client.tsx` - Página específica de anime
- `home-page-client.tsx` - Página principal

**Componentes de `cards/`:**
- `core-info-card.tsx` - Información principal (portada, título, score)
- `synopsis-card.tsx` - Sinopsis
- `details-card.tsx` - Detalles técnicos
- `stats-card.tsx` - Estadísticas
- `socials-card.tsx` - Enlaces a redes sociales
- `official-links-card.tsx` - Enlaces oficiales
- `related-card.tsx` - Títulos relacionados
- `episodes-card.tsx` - Lista de episodios
- `media-gallery.tsx` - Galería multimedia
- `characters-card.tsx` - Tarjeta de personajes
- `reviews-card.tsx` - Tarjeta de reseñas
- `recommendations-card.tsx` - Recomendaciones

**Componentes de `displays/`:**
- `characters-display.tsx` - Display de personajes con actores
- `staff-display.tsx` - Display de staff y producción
- `studios-display.tsx` - Display de estudios
- `episodes-display.tsx` - Display de episodios

**Uso:**
```tsx
import { MediaPageClient } from '@/components/media';
import { CoreInfoCard, SynopsisCard } from '@/components/media';
import { CharactersDisplay } from '@/components/media';
```

---

### `catalog/` - Catálogos y Búsquedas
Componentes para listar y buscar medios.

**Componentes:**
- `all-media-catalog.tsx` - Catálogo general de medios
- `top-media-list.tsx` - Lista de medios top
- `top-media-section.tsx` - Sección de medios destacados
- `genre-grid-card.tsx` - Grid de géneros
- `search-bar.tsx` - Barra de búsqueda

**Uso:**
```tsx
import { AllMediaCatalog, SearchBar } from '@/components/catalog';
```

---

### `rankings/` - Rankings y Tops
Componentes para mostrar rankings y tops.

**Componentes:**
- `top-ranking-carousel.tsx` - Carrusel de rankings
- `top-ranking-slideshow.tsx` - Slideshow de rankings
- `top-characters-card.tsx` - Top personajes
- `top-people-card.tsx` - Top personas (staff/actores)
- `top-active-users-card.tsx` - Usuarios más activos

**Uso:**
```tsx
import { TopRankingCarousel, TopCharactersCard } from '@/components/rankings';
```

---

### `user/` - Perfil de Usuario
Componentes relacionados con el perfil y datos del usuario.

**Componentes:**
- `user-avatar.tsx` - Avatar de usuario
- `user-media-list.tsx` - Lista de medios del usuario
- `user-comments-history.tsx` - Historial de comentarios
- `user-contributions-card.tsx` - Contribuciones del usuario
- `favorites-card.tsx` - Favoritos
- `custom-lists-card.tsx` - Listas personalizadas
- `custom-list-accordion.tsx` - Acordeón de listas
- `contributions-card.tsx` - Tarjeta de contribuciones
- `notifications-button.tsx` - Botón de notificaciones
- `notifications-history.tsx` - Historial de notificaciones

**Uso:**
```tsx
import { UserAvatar, FavoritesCard } from '@/components/user';
```

---

### `lists/` - Gestión de Listas
Componentes para crear y gestionar listas personalizadas.

**Componentes:**
- `add-to-list-dialog.tsx` - Diálogo para agregar a lista
- `list-form-dialog.tsx` - Formulario de lista
- `list-privacy-toggle.tsx` - Toggle de privacidad de lista
- `privacy-toggle.tsx` - Toggle de privacidad genérico

**Uso:**
```tsx
import { AddToListDialog, ListFormDialog } from '@/components/lists';
```

---

### `reviews/` - Sistema de Reseñas
Componentes para crear y mostrar reseñas.

**Componentes:**
- `review-dialog.tsx` - Diálogo para escribir reseña
- `star-rating.tsx` - Componente de calificación por estrellas

**Uso:**
```tsx
import { ReviewDialog, StarRating } from '@/components/reviews';
```

---

### `comments/` - Sistema de Comentarios
Componentes para el sistema de comentarios.

**Componentes:**
- `comment-form.tsx` - Formulario de comentario
- `comment-item.tsx` - Item de comentario individual
- `comments-section.tsx` - Sección de comentarios
- `report-comment-dialog.tsx` - Reportar comentario
- `index.ts` - Exportaciones

**Uso:**
```tsx
import { CommentsSection, CommentForm } from '@/components/comments';
```

---

### `contributions/` - Sistema de Contribuciones
Componentes para que usuarios contribuyan con información.

**Formularios de Contribución:**

| Componente | Usado por | Descripción |
|------------|-----------|-------------|
| `anime-contribution-form.tsx` | Anime, Donghua | Formulario completo con episodios, estudios, personajes con VA, enlaces externos |
| `contribution-form.tsx` | Manga, Manhwa, Manhua, Novela, Fan Comic | Formulario para medios de lectura con volúmenes, capítulos, editoriales |

**Componentes de Soporte:**
- `contribution-dialog.tsx` - Diálogo de contribución
- `entity-contribution-form.tsx` - Formulario de entidad (personaje, staff, etc.)
- `character-selector.tsx` - Selector de personajes con actores de voz
- `staff-selector.tsx` - Selector de staff con roles
- `studio-selector.tsx` - Selector de estudios
- `staff-search.tsx` - Búsqueda de staff
- `studio-search.tsx` - Búsqueda de estudios
- `media-relation-search.tsx` - Búsqueda de relaciones

**Uso:**
```tsx
// Para anime/donghua
import { AnimeContributionForm } from '@/components/contributions';
<AnimeContributionForm mediaType="anime" />
<AnimeContributionForm mediaType="donghua" />

// Para manga/manhwa/manhua/novela/fan-comic
import { ContributionForm } from '@/components/contributions';
<ContributionForm mediaType="manga" />
```

---

### `moderation/` - Herramientas de Moderación
Componentes para moderadores y administradores.

**Componentes:**
- `disapproval-dialog.tsx` - Diálogo de desaprobación
- `reported-comments-content.tsx` - Comentarios reportados
- `reported-reviews-content.tsx` - Reseñas reportadas
- `review-contribution-dialog.tsx` - Revisar contribución

**Uso:**
```tsx
import { DisapprovalDialog } from '@/components/moderation';
```

---

### `shared/` - Componentes Compartidos
Componentes genéricos reutilizables en toda la aplicación.

**Componentes:**
- `favorite-button.tsx` - Botón de favorito
- `export-button.tsx` - Botón de exportar
- `delete-item-button.tsx` - Botón de eliminar
- `pagination-controls.tsx` - Controles de paginación
- `horizontal-menu.tsx` - Menú horizontal
- `character-image.tsx` - Imagen de personaje
- `add-relation-dialog.tsx` - Diálogo de relación
- `report-problem-dialog.tsx` - Reportar problema
- `recommendation-card.tsx` - Tarjeta de recomendación
- `recommendations.tsx` - Lista de recomendaciones
- `latest-posts-card.tsx` - Últimas publicaciones
- `details-tab.tsx` - Tab de detalles
- `characters-tab.tsx` - Tab de personajes

**Uso:**
```tsx
import { FavoriteButton, PaginationControls } from '@/components/shared';
```

---

### `ui/` - Componentes Base
Componentes base de shadcn/ui (botones, inputs, cards, etc.)

**Uso:**
```tsx
import { Button, Input, Card } from '@/components/ui';
```

---

## 🔄 Migración de Imports

### Antes:
```tsx
import MainNav from '@/components/main-nav';
import CoreInfoCard from '@/components/core-info-card';
import FavoriteButton from '@/components/favorite-button';
```

### Ahora:
```tsx
import { MainNav } from '@/components/layout';
import { CoreInfoCard } from '@/components/media';
import { FavoriteButton } from '@/components/shared';
```

---

## ✅ Ventajas de la Nueva Estructura

1. **🎯 Organización lógica**: Componentes agrupados por funcionalidad
2. **🔍 Fácil navegación**: Sabes exactamente dónde buscar cada componente
3. **♻️ Reutilización**: Componentes compartidos claramente identificados
4. **📈 Escalabilidad**: Fácil agregar nuevos componentes en la categoría correcta
5. **🧹 Mantenibilidad**: Código más limpio y estructurado
6. **👥 Colaboración**: Múltiples desarrolladores pueden trabajar sin conflictos

---

## 🚀 Próximos Pasos

### Auth:
- [ ] Crear `login-form.tsx`
- [ ] Crear `register-form.tsx`
- [ ] Crear `forgot-password-dialog.tsx`
- [ ] Implementar autenticación con Google
- [ ] Crear `verify-email.tsx`

### Mejoras:
- [ ] Actualizar todos los imports en la aplicación
- [ ] Crear tests unitarios por carpeta
- [ ] Documentar props de cada componente
- [ ] Crear Storybook por categoría

---

## 📝 Notas

- Mantener componentes lo más **específicos** posible
- Si un componente se usa en **3+ lugares diferentes**, moverlo a `shared/`
- Cada carpeta debe tener su `index.ts` para facilitar imports
- Usar nombres descriptivos y consistentes
- Comentar componentes complejos

---

**Fecha de reorganización:** 6 de Noviembre, 2025
**Autor:** Equipo Chirisu
