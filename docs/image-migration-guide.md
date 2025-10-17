# Guía de Migración: Image → SafeImage

## Componente SafeImage

El componente `SafeImage` maneja automáticamente todos los casos de error en imágenes:

**Estrategia de resolución:**
1. Intenta cargar desde BD (prop `src`)
2. Si falla, intenta URL externa
3. Si todo falla → Muestra "Sin Imagen"

**Características:**
- ✅ Maneja `src` vacía, `null`, `undefined`
- ✅ Detecta errores 404, CORS, timeout
- ✅ Placeholder visual con icono y texto
- ✅ Loading state con animación pulse
- ✅ Compatible con todas las props de `next/image`

## Patrón de migración

### ❌ ANTES (Image con problemas)
```tsx
import Image from 'next/image';

<Image
  src={item.imageUrl}
  alt={item.title}
  width={60}
  height={90}
  className="rounded-md object-cover"
  data-ai-hint={item.imageHint}  // ← Eliminar
/>
```

### ✅ DESPUÉS (SafeImage)
```tsx
import { SafeImage } from '@/components/ui/safe-image';

<SafeImage
  src={item.imageUrl}
  alt={item.title}
  width={60}
  height={90}
  className="rounded-md"  // ← Sin object-cover
  objectFit="cover"       // ← Prop separada
/>
```

## Cambios necesarios

### 1. Import
```tsx
// Reemplazar:
import Image from 'next/image';

// Por:
import { SafeImage } from '@/components/ui/safe-image';
```

### 2. Componente
```tsx
// Reemplazar:
<Image

// Por:
<SafeImage
```

### 3. Props
```tsx
// ELIMINAR: data-ai-hint
// MOVER: object-cover de className a prop objectFit

// Antes:
className="rounded-md object-cover"

// Después:
className="rounded-md"
objectFit="cover"
```

## Componentes migrados ✅

- [x] `safe-image.tsx` - Componente base creado
- [x] `top-characters-card.tsx`
- [x] `top-people-card.tsx`
- [x] `favorites-card.tsx` (3 tabs: personajes, voice actors, staff)
- [x] `top-ranking-carousel.tsx`
- [x] `top-media-list.tsx`
- [x] `recommendations-card.tsx`
- [x] `user-media-list.tsx`

## Componentes pendientes de migración

### Prioridad ALTA (páginas principales)
- [ ] `media-page.tsx` - Página de detalle de media
- [ ] `anime-page-client.tsx` - Cliente de página anime
- [ ] `characters-tab.tsx` - Tab de personajes
- [ ] `episodes-card.tsx` - Card de episodios

### Prioridad MEDIA (tarjetas de contenido)
- [ ] `related-card.tsx` - Contenido relacionado
- [ ] `core-info-card.tsx` - Info principal
- [ ] `characters-card.tsx` - Card de personajes
- [ ] `genre-grid-card.tsx` - Grilla de géneros
- [ ] `recommendation-card.tsx` - Card de recomendación individual

### Prioridad BAJA (componentes de display)
- [ ] `staff-display.tsx` - Display de staff
- [ ] `studios-display.tsx` - Display de estudios
- [ ] `characters-display.tsx` - Display de personajes
- [ ] `characters-display.old.tsx` - Versión antigua
- [ ] `media-gallery.tsx` - Galería de medios
- [ ] `top-ranking-slideshow.tsx` - Slideshow de ranking

## Validación

Después de migrar cada componente:

1. **Compilación:**
   ```bash
   # Verificar errores TypeScript
   npm run build
   ```

2. **Runtime:**
   - Abrir página en navegador
   - Verificar que imágenes cargan
   - Inspeccionar console (no debe haber warnings de src="")
   - Probar imágenes rotas (deben mostrar "Sin Imagen")

3. **Visual:**
   - Placeholder debe tener:
     - Fondo gris (`bg-muted`)
     - Icono de imagen (ImageIcon)
     - Texto "Sin Imagen"

## Notas técnicas

### Props de SafeImage
```typescript
interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackText?: string;
}
```

### Estado interno
```typescript
const [imageError, setImageError] = useState(false);
const [isLoading, setIsLoading] = useState(true);
```

### Eventos manejados
- `onError` → Marca error, muestra placeholder
- `onLoad` → Quita loading state, muestra imagen

### Logging
```typescript
console.warn(`⚠️ Error al cargar imagen: ${src}`);
```

## Comandos útiles

```bash
# Buscar todos los usos de Image
grep -r "import Image from 'next/image'" src/components

# Buscar componentes con <Image
grep -r "<Image" src/components

# Ver diferencias
git diff src/components/
```

## Ejemplo completo

### Antes
```tsx
import Image from 'next/image';

export function ExampleCard({ data }) {
  return (
    <div className="relative aspect-[2/3]">
      <Image
        src={data.imageUrl}
        alt={data.name}
        fill
        className="object-cover rounded-lg"
        data-ai-hint={data.imageHint}
        priority
      />
    </div>
  );
}
```

### Después
```tsx
import { SafeImage } from '@/components/ui/safe-image';

export function ExampleCard({ data }) {
  return (
    <div className="relative aspect-[2/3]">
      <SafeImage
        src={data.imageUrl}
        alt={data.name}
        fill
        className="rounded-lg"
        objectFit="cover"
        priority
      />
    </div>
  );
}
```

## Resolución de problemas

### Error: "empty string passed to src"
**Causa:** `imageUrl` es `""` (string vacío)  
**Solución:** SafeImage maneja esto automáticamente

### Error: "Cannot be used as JSX component"
**Causa:** Todavía se está importando `Image` en lugar de `SafeImage`  
**Solución:** Verificar imports en el archivo

### Placeholder no se ve
**Causa:** Contenedor no tiene dimensiones definidas  
**Solución:** Asegurar que el contenedor tenga width/height o use aspect-ratio

### Imagen no carga pero tampoco muestra placeholder
**Causa:** `src` tiene valor pero la URL es inválida  
**Solución:** SafeImage detecta esto con `onError` - verificar network tab

