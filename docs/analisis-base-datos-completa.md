# Análisis Completo de Base de Datos - Chirisu

**Fecha:** 2025-11-04  
**Base de Datos:** `bd_chirisu`  
**Schema:** `app`  
**Total de Tablas:** 47

---

## 📊 Resumen Ejecutivo

### Categorización de Tablas

| Categoría | Cantidad | Acción al Limpiar |
|-----------|----------|-------------------|
| **Usuarios y Autenticación** | 6 | ✅ PRESERVAR |
| **Medios Principales** | 8 | ❌ ELIMINAR |
| **Personas (Personajes, Actores, Staff)** | 3 | ❌ ELIMINAR |
| **Organizaciones (Studios)** | 1 | ❌ ELIMINAR |
| **Relaciones entre Entidades** | 8 | ❌ ELIMINAR |
| **Contenido Adicional** | 4 | ❌ ELIMINAR |
| **Interacciones de Usuarios** | 8 | ❌ ELIMINAR |
| **Catálogos y Metadatos** | 4 | ❌ ELIMINAR (excepto media_statuses) |
| **Sistema y Auditoría** | 5 | ❌ ELIMINAR |

---

## 📋 Detalle Completo de Tablas

### 1️⃣ USUARIOS Y AUTENTICACIÓN (✅ PRESERVAR)

| Tabla | Columnas | Descripción | Preservar |
|-------|----------|-------------|-----------|
| `users` | 25 | Usuarios del sistema (credenciales, perfil, configuración) | ✅ SÍ |
| `roles` | 5 | Roles del sistema (admin, moderator, user, etc.) | ✅ SÍ |
| `permissions` | 7 | Permisos granulares del sistema | ✅ SÍ |
| `role_permissions` | 2 | Relación entre roles y permisos | ✅ SÍ |
| `user_roles` | 4 | Roles asignados a usuarios | ✅ SÍ |
| `media_statuses` | 5 | Estados de medios (airing, finished, upcoming, etc.) | ✅ SÍ |

**Razón:** Necesarios para mantener el sistema de usuarios y autenticación funcional.

---

### 2️⃣ MEDIOS PRINCIPALES (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `anime` | 39 | Series de anime japonés | 19,575 |
| `manga` | 34 | Manga japonés | 41,209 |
| `manhwa` | 35 | Manhwa coreano | 50 |
| `manhua` | 35 | Manhua chino | 22 |
| `novels` | 34 | Novelas ligeras | 4,807 |
| `donghua` | 39 | Donghua (anime chino) | 1,885 |
| `fan_comic` | 32 | Fan comics (tabla legacy) | 0 |
| `fan_comics` | 28 | Fan comics | 3 |

**Total Medios:** 67,551

**Campos Comunes:**
- Información básica: título (romaji, nativo, inglés), tipo, formato
- Fechas: inicio, fin, publicación
- Metadata: sinopsis, puntuación promedio, número de ratings
- Asociaciones: creator, status, country_of_origin
- SEO: slug único para URLs
- Auditoría: created_by, updated_by, created_at, updated_at
- Estado: is_approved, is_published, is_adult

---

### 3️⃣ PERSONAS - PERSONAJES, ACTORES, STAFF (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `characters` | 14 | Personajes de anime/manga | 97,702 |
| `voice_actors` | 14 | Actores de voz (seiyuus) | 144,694 |
| `staff` | 16 | Personal creativo (directores, escritores, etc.) | ~100,000+ |

**Campos Comunes:**
- Nombres: name_romaji, name_native, name (inglés)
- Identificadores: anilist_id, slug único
- Imagen: image_url
- Biografía: bio/description
- Información personal: gender, date_of_birth, blood_type, hometown
- Popularidad: favorites_count
- Auditoría: created_at, updated_at

**Nota:** Sistema de slugs únicos implementado (`nombre-{anilist_id}`) para prevenir duplicados.

---

### 4️⃣ ORGANIZACIONES (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `studios` | 2 | Estudios de animación | ~5,000+ |

**Campos:**
- name: Nombre del studio
- favorites_count: Popularidad

---

### 5️⃣ RELACIONES ENTRE ENTIDADES (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `characterable_characters` | 4 | Personajes → Medios (polymorphic) | 217,507 |
| `character_voice_actors` | 4 | Personajes → Actores de Voz (por medio) | ~100,000+ |
| `staffable_staff` | 4 | Staff → Medios (polymorphic) con rol | ~200,000+ |
| `studiable_studios` | 4 | Studios → Medios (polymorphic) | ~50,000+ |
| `media_genres` | 4 | Géneros → Medios (polymorphic) | ~300,000+ |
| `taggable_tags` | 4 | Tags → Medios (polymorphic) | Variable |
| `media_relations` | 6 | Relaciones entre medios (adaptaciones, sequels, etc.) | 232+ |
| `external_links` | 6 | Enlaces externos (MyAnimeList, AniDB, etc.) | ~50,000+ |

**Relaciones Polymorphic:**
- Usan `{tabla}_type` (ej: "anime", "manga") + `{tabla}_id`
- Permiten relaciones flexibles con múltiples tipos de medios

**Tipos de Relaciones Media (media_relations):**
- adaptation (adaptación manga↔anime)
- sequel / prequel (secuelas)
- side_story / spin_off
- alternative (versiones alternativas)
- character (comparten personajes)
- parent / summary / other

---

### 6️⃣ CONTENIDO ADICIONAL (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `episodes` | 15 | Episodios de anime | ~500,000+ |
| `alternative_titles` | 5 | Títulos alternativos de medios | ~100,000+ |
| `media_trailers` | 11 | Trailers (YouTube, etc.) | ~20,000+ |
| `trailer_views` | 7 | Vistas de trailers por usuario | Variable |

**Episodios:**
- anime_id (FK a anime)
- Información: title, episode_number, air_date, duration
- Metadata: synopsis, thumbnail_url
- Auditoría: created_at, updated_at

---

### 7️⃣ INTERACCIONES DE USUARIOS (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `reviews` | 10 | Reviews de medios por usuarios | Variable |
| `review_votes` | 3 | Votos en reviews (útil/no útil) | Variable |
| `comments` | 13 | Comentarios (polymorphic: medios, reviews, etc.) | Variable |
| `comment_reactions` | 3 | Reacciones a comentarios (like, etc.) | Variable |
| `lists` | 9 | Listas personalizadas de usuarios | Variable |
| `list_items` | 9 | Items en listas de usuarios | Variable |
| `user_favorites` | 6 | Favoritos de usuarios (polymorphic) | Variable |
| `notifications` | 8 | Notificaciones de usuarios | Variable |

**Características:**
- Reviews: Puntuación, contenido, spoiler flag, votes
- Comentarios: Sistema de threading (parent_id), polymorphic
- Listas: Públicas/privadas, descripción, items ordenados
- Favoritos: Polymorphic (personajes, actores, medios, etc.)

---

### 8️⃣ CATÁLOGOS Y METADATOS (❌ ELIMINAR excepto media_statuses)

| Tabla | Columnas | Descripción | Preservar |
|-------|----------|-------------|-----------|
| `genres` | 8 | Géneros (Action, Romance, etc.) | ❌ NO |
| `tags` | 3 | Tags/etiquetas descriptivas | ❌ NO |
| `media_statuses` | 5 | Estados de emisión (airing, finished, etc.) | ✅ SÍ |
| `rankings_cache` | 8 | Cache de rankings/tops | ❌ NO |

**Media Statuses:**
- airing / releasing (emisión actual)
- finished (completado)
- upcoming / not_yet_released
- cancelled / hiatus

---

### 9️⃣ SISTEMA Y AUDITORÍA (❌ ELIMINAR)

| Tabla | Columnas | Descripción | Registros Actuales |
|-------|----------|-------------|--------------------|
| `content_contributions` | 16 | Contribuciones de usuarios (agregar/editar medios) | Variable |
| `user_contributions` | 12 | Historial de contribuciones por usuario | Variable |
| `content_reports` | 9 | Reportes de contenido | Variable |
| `audit_log` | 8 | Log de auditoría de cambios | Variable |
| `action_points` | 2 | Puntos de acción de usuarios | Variable |

**Sistema de Contribuciones:**
- Flujo: pending → approved / rejected
- Moderación: assigned_to, reviewed_by
- Tipos: add_anime, edit_anime, add_character, etc.
- Tracking completo: before_data, after_data (JSONB)

---

## 🔄 Orden de Eliminación (Respeta Foreign Keys)

```
1. Interacciones de Usuarios
   ├── action_points
   ├── user_contributions
   ├── user_favorites
   ├── user_follows
   ├── list_items → lists
   ├── comment_reactions → comments
   ├── comments (self-referencing)
   ├── review_votes → reviews
   ├── reviews
   ├── notifications
   ├── trailer_views
   ├── content_contributions
   ├── content_reports
   └── audit_log

2. Relaciones entre Entidades
   ├── character_voice_actors
   ├── characterable_characters
   ├── staffable_staff
   ├── studiable_studios
   ├── media_genres
   ├── taggable_tags
   └── media_relations

3. Contenido de Medios
   ├── episodes (depende de anime)
   ├── alternative_titles
   ├── external_links
   ├── media_trailers
   └── [anime, manga, manhwa, manhua, novels, donghua, fan_comic, fan_comics]

4. Entidades Base
   ├── characters
   ├── voice_actors
   ├── staff
   └── studios

5. Catálogos
   ├── genres
   ├── tags
   └── rankings_cache
```

---

## 📈 Estadísticas de Integridad

### Foreign Keys Totales: 59

**Tablas con más dependencias:**
- `users`: 20 tablas dependen de ella
- `anime`: 3 tablas dependen de ella
- Relaciones polymorphic: 8 tablas usan este patrón

### Constraints UNIQUE Importantes
- `users.email` - Email único
- `users.username` - Username único
- `characters.slug` - Slug único
- `voice_actors.slug` - Slug único
- `staff.slug` - Slug único
- `media_relations` - (source_type, source_id, target_type, target_id) único

---

## 🎯 Estrategia de Limpieza Implementada

### Scripts Creados

1. **`reset-database-keep-users.sql`**
   - Script SQL transaccional
   - Elimina TODO excepto usuarios y roles
   - Resetea secuencias de IDs
   - Muestra estadísticas antes/después

2. **`reset-database.ps1`**
   - Script PowerShell con seguridad máxima
   - Crea backup automático
   - Requiere confirmación explícita
   - Manejo de errores completo

3. **`reset-database-quick.ps1`**
   - Ejecución rápida sin confirmación
   - Solo para desarrollo

### Datos Preservados (6 tablas)

```sql
-- PRESERVADO
✅ users            (25 columnas) - Usuarios del sistema
✅ roles            (5 columnas)  - Roles (admin, moderator, user)
✅ permissions      (7 columnas)  - Permisos granulares
✅ role_permissions (2 columnas)  - Relación roles-permisos
✅ user_roles       (4 columnas)  - Roles asignados a usuarios
✅ media_statuses   (5 columnas)  - Estados de medios
```

### Datos Eliminados (41 tablas)

```sql
-- MEDIOS (8 tablas)
❌ anime, manga, manhwa, manhua, novels, donghua, fan_comic, fan_comics

-- PERSONAS (3 tablas)
❌ characters, voice_actors, staff

-- ORGANIZACIONES (1 tabla)
❌ studios

-- RELACIONES (8 tablas)
❌ characterable_characters, character_voice_actors, staffable_staff,
   studiable_studios, media_genres, taggable_tags, media_relations,
   external_links

-- CONTENIDO (4 tablas)
❌ episodes, alternative_titles, media_trailers, trailer_views

-- INTERACCIONES USUARIO (8 tablas)
❌ reviews, review_votes, comments, comment_reactions,
   lists, list_items, user_favorites, notifications

-- CATÁLOGOS (3 tablas)
❌ genres, tags, rankings_cache

-- SISTEMA (6 tablas)
❌ content_contributions, user_contributions, content_reports,
   audit_log, action_points, user_follows
```

---

## 🔐 Seguridad y Backups

### Backup Automático
El script `reset-database.ps1` crea backups con formato:
```
backups/backup-before-reset-YYYY-MM-DD-HHmmss.sql
```

### Restauración
```powershell
psql -U postgres -d bd_chirisu -f backups/backup-before-reset-2025-11-04-123456.sql
```

### Transacciones
Todo el script se ejecuta en una transacción:
- Si falla cualquier paso → ROLLBACK automático
- Base de datos queda consistente

---

## 📝 Uso Recomendado

### Para Desarrollo (Limpieza Frecuente)
```powershell
# Limpiar y re-importar
.\scripts\database\reset-database-quick.ps1
cd scripts\import
npm run import run -- -s anilist -t anime -l 100
```

### Para Testing (Con Backup)
```powershell
# Limpiar con backup de seguridad
.\scripts\database\reset-database.ps1

# Verificar estado
psql -U postgres -d bd_chirisu -c "
  SELECT 'Usuarios' as tipo, COUNT(*) FROM app.users
  UNION ALL SELECT 'Medios', COUNT(*) FROM app.anime
"
```

---

## ⚠️ Consideraciones Importantes

### 1. Usuarios Preservados
- **Todos los usuarios se mantienen intactos**
- Contraseñas, roles, permisos preservados
- Listas, favoritos, reviews se eliminan pero el usuario permanece

### 2. IDs Reseteados
- Todas las secuencias vuelven a 1
- Próximo anime tendrá `id = 1`
- Próximo personaje tendrá `id = 1`

### 3. Sistema de Roles Intacto
- Roles: admin, moderator, user
- Permisos: create_media, edit_media, delete_media, etc.
- Relaciones roles-permisos preservadas

### 4. Estados de Medios Preservados
- airing, finished, upcoming, cancelled, hiatus
- Necesarios para el sistema de importación

---

## 🚀 Próximos Pasos Después de Limpiar

1. **Verificar usuarios preservados**
   ```sql
   SELECT id, username, email FROM app.users;
   ```

2. **Importar datos frescos**
   ```bash
   npm run import run -- -s anilist -t anime -l 100
   npm run import run -- -s anilist -t manga -l 100
   ```

3. **Verificar integridad**
   ```sql
   SELECT COUNT(*) FROM app.anime;
   SELECT COUNT(*) FROM app.characters;
   SELECT COUNT(*) FROM app.media_relations;
   ```

4. **Verificar relaciones funcionan**
   ```sql
   SELECT a.title_romaji, mr.relation_type, m.title_romaji
   FROM app.anime a
   JOIN app.media_relations mr ON mr.source_id = a.id
   JOIN app.manga m ON mr.target_id = m.id
   LIMIT 10;
   ```

---

## 📚 Documentación Adicional

- [Scripts de Database](./scripts/database/README.md)
- [Mejoras en Importación AniList](./docs/mejoras-importacion-anilist.md)
- [Blueprint del Proyecto](./docs/blueprint.md)
