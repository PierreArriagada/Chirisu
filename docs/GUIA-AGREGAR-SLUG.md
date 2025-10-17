# 📋 Guía para Agregar Columna SLUG

## 🎯 Objetivo
Agregar la columna `slug` a todas las tablas de media para URLs amigables con SEO.

## 📝 Pasos para Ejecutar

### Opción 1: Usando pgAdmin o DBeaver

1. **Abre tu cliente de PostgreSQL** (pgAdmin, DBeaver, TablePlus, etc.)

2. **Conéctate a tu base de datos** Chirisu

3. **Abre el archivo** `docs/ADD-SLUG-COLUMN.sql`

4. **Copia todo el contenido**

5. **Pega en el Query Editor** de tu cliente PostgreSQL

6. **ANTES DE EJECUTAR:** Verifica qué tablas realmente existen
   - Si solo tienes `anime`, `manga`, `novels` → Descomenta solo esas secciones
   - Si tienes más tablas → Descomenta las secciones correspondientes

7. **Ejecuta el script completo**

8. **Verifica los resultados:**
   ```sql
   SELECT id, title_romaji, slug FROM app.anime LIMIT 5;
   SELECT id, title_romaji, slug FROM app.manga LIMIT 5;
   SELECT id, title_romaji, slug FROM app.novels LIMIT 5;
   ```

### Opción 2: Usando terminal (psql)

```bash
# Conectar a la base de datos
psql -U tu_usuario -d chirisu

# Ejecutar el script
\i C:/Users/boris/OneDrive/Documentos/Chirisu/docs/ADD-SLUG-COLUMN.sql

# O copiar y pegar el contenido directamente
```

## ✅ Verificación

Después de ejecutar, deberías ver slugs como:

| ID | Title | Slug |
|----|-------|------|
| 1 | Jujutsu Kaisen | jujutsu-kaisen-1 |
| 2 | One Piece | one-piece-2 |
| 3 | Chainsaw Man | chainsaw-man-3 |

## 🔄 Actualizar la API

Una vez agregado el slug a la base de datos, actualiza la API:

```typescript
// En src/app/api/media/route.ts
const mediaQuery = `
  SELECT 
    id,
    slug,  // ✅ Ahora sí existe
    title_native,
    // ... resto de campos
`;
```

## 🎨 Resultado Final

Las URLs cambiarán de:
- ❌ `/anime/123`

A:
- ✅ `/anime/jujutsu-kaisen-123`

Mucho más amigable con SEO y los usuarios! 🎉

## ⚠️ Importante

- El slug incluye el ID al final para garantizar unicidad
- Si cambias el título, el slug NO cambia automáticamente (por diseño)
- Si quieres cambiar un slug manualmente:
  ```sql
  UPDATE app.anime SET slug = 'nuevo-slug-123' WHERE id = 123;
  ```
