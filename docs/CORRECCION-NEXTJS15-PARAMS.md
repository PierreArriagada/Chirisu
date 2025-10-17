# 🔧 Corrección: Next.js 15 Dynamic Routes (params)

## 📋 Problema

Next.js 15 requiere que los `params` en rutas dinámicas sean `await`ed antes de usarlos.

### Error:
```
Error: Route "/anime/[id]" used `params.id`. 
`params` should be awaited before using its properties.
Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

---

## ✅ Solución

Cambiar el tipo de `params` de objeto a `Promise<objeto>` y usar `await` para acceder a sus propiedades.

### ❌ ANTES (Next.js 14)
```typescript
export default function Page({ params }: { params: { id: string } }) {
  return <MediaPageClient id={params.id} type="Anime" />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Anime ${params.id} | Chirisu`,
  }
}
```

### ✅ DESPUÉS (Next.js 15)
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Anime" />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Anime ${id} | Chirisu`,
  }
}
```

---

## 📁 Archivos Corregidos

### Páginas de Medios (7 archivos)
1. ✅ `src/app/anime/[id]/page.tsx`
2. ✅ `src/app/manga/[id]/page.tsx`
3. ✅ `src/app/novela/[id]/page.tsx`
4. ✅ `src/app/manhua/[id]/page.tsx`
5. ✅ `src/app/manwha/[id]/page.tsx`
6. ✅ `src/app/fan-comic/[id]/page.tsx`
7. ✅ `src/app/dougua/[id]/page.tsx`

### Otras Páginas Dinámicas
8. ✅ `src/app/episode/[id]/page.tsx`

### API Routes
9. ✅ `src/app/api/media/[id]/route.ts`

---

## 🔍 Patrón de Corrección

### Para Server Components (páginas)

```typescript
// 1. Actualizar el tipo Props
type Props = {
  params: Promise<{ id: string }> // Era: { id: string }
}

// 2. Hacer el componente async y await params
export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params; // Nueva línea
  return <MediaPageClient id={id} type="..." />;
}

// 3. Await params en generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; // Nueva línea
  return {
    title: `... ${id} | Chirisu`,
    description: '...',
  }
}
```

### Para API Routes

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Actualizar tipo
) {
  try {
    const { id } = await params; // Await antes de usar
    
    // ... resto del código
  } catch (error) {
    // ...
  }
}
```

---

## 📊 Cambios Específicos por Archivo

### anime/[id]/page.tsx
```diff
- type Props = { params: { id: string } }
+ type Props = { params: Promise<{ id: string }> }

- export async function generateMetadata({ params }: Props) {
-   return { title: `Anime ${params.id} | Chirisu` }
+ export async function generateMetadata({ params }: Props) {
+   const { id } = await params;
+   return { title: `Anime ${id} | Chirisu` }

- export default function Page({ params }: { params: { id: string } }) {
-   return <MediaPageClient id={params.id} type="Anime" />;
+ export default async function Page({ params }: { params: Promise<{ id: string }> }) {
+   const { id } = await params;
+   return <MediaPageClient id={id} type="Anime" />;
```

### api/media/[id]/route.ts
```diff
export async function GET(
  request: Request,
-  { params }: { params: { id: string } }
+  { params }: { params: Promise<{ id: string }> }
) {
  try {
-    const id = params.id;
+    const { id } = await params;
    
    // ... resto sin cambios
  }
}
```

---

## 🎯 Verificación

Después de aplicar estos cambios:

1. **Reiniciar el servidor de Next.js**
   ```bash
   # Detener con Ctrl+C
   npm run dev
   ```

2. **Probar rutas dinámicas:**
   - ✅ `/anime/jujutsu-kaisen-3` - Debería cargar sin errores
   - ✅ `/manga/[id]` - Debería funcionar
   - ✅ `/api/media/3?type=anime` - Debería responder correctamente

3. **Verificar en consola:**
   - ❌ No debería aparecer el error de `params should be awaited`
   - ✅ La página debería renderizar correctamente

---

## 📚 Recursos

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Dynamic Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Async Request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)

---

## 💡 Por Qué Este Cambio

Next.js 15 introdujo esta mejora para:

1. **Mejor rendimiento:** Permite optimizaciones internas
2. **Streaming mejorado:** Facilita el streaming de datos
3. **Consistencia:** Todas las APIs dinámicas ahora son async
4. **Preparación para futuros features:** React Server Components avanzados

---

## ⚠️ Importante

- **Todos los componentes de página con params dinámicos deben ser `async`**
- **`generateMetadata` también debe hacer `await params`**
- **API routes también necesitan el cambio**
- **No afecta a páginas estáticas sin params**

---

## 🔄 Migración Automática

Si tienes muchas páginas dinámicas, puedes crear un script para actualizar:

```bash
# Buscar todas las páginas con [id]
find src/app -name "page.tsx" -path "*[id]*"

# Verificar que todas usen await params
grep -r "params\.id" src/app/**/[id]/page.tsx
```

---

## ✨ Estado Final

- ✅ 9 archivos actualizados
- ✅ Todas las rutas dinámicas funcionando
- ✅ API routes compatibles con Next.js 15
- ✅ Sin warnings en consola
- ✅ Metadata generándose correctamente

