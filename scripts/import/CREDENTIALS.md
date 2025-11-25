# 🔑 Configuración de Credenciales

Este archivo muestra cómo obtener y configurar las credenciales necesarias para las APIs externas.

## MyAnimeList API

### Obtener CLIENT_ID

1. **Crear cuenta en MyAnimeList**:
   - Ve a https://myanimelist.net/register.php
   - Completa el registro

2. **Crear aplicación API**:
   - Ve a https://myanimelist.net/apiconfig
   - Click en "Create ID"
   - Llena el formulario:
     - **App Name**: Chirisu Importer
     - **App Type**: Web
     - **App Description**: Sistema de importación para Chirisu
     - **App Redirect URL**: http://localhost (no se usa, pero es requerido)
     - **Homepage URL**: http://localhost
     - **Commercial / Non-Commercial**: Non-Commercial
   
3. **Copiar credenciales**:
   - Se mostrará tu **Client ID**
   - Opcional: Generar **Client Secret** (para OAuth completo, no necesario para lectura básica)

4. **Actualizar config.ts**:
   ```typescript
   export const API_CREDENTIALS = {
     MAL: {
       CLIENT_ID: 'abc123def456ghi789', // Tu Client ID aquí
       CLIENT_SECRET: '', // Opcional
       BASE_URL: 'https://api.myanimelist.net/v2',
     },
   }
   ```

### Límites de MyAnimeList

- ✅ **Sin autenticación (solo Client ID)**:
  - 60 requests por minuto
  - Solo endpoints públicos (anime list, manga list, details)
  
- ✅ **Con autenticación OAuth** (Client ID + Secret):
  - 60 requests por minuto
  - Acceso a endpoints privados (listas de usuarios, actualizar listas)

Para este sistema de importación, **solo necesitas Client ID** (sin OAuth).

## AniList API

### ¡No requiere credenciales!

AniList tiene una API GraphQL completamente pública. No necesitas:
- ❌ API Key
- ❌ Client ID
- ❌ Registro de aplicación
- ❌ Tokens

Simplemente funciona con:
```typescript
export const API_CREDENTIALS = {
  ANILIST: {
    BASE_URL: 'https://graphql.anilist.co',
  },
}
```

### Límites de AniList

- ✅ **Sin autenticación**:
  - 90 requests por minuto
  - Acceso completo a datos públicos
  
- ✅ **Con autenticación OAuth** (opcional):
  - 90 requests por minuto
  - Acceso a datos privados de usuario

Para este sistema, **no necesitas autenticación**.

## Kitsu API (Opcional)

Kitsu también tiene una API REST pública sin necesidad de credenciales:

```typescript
export const API_CREDENTIALS = {
  KITSU: {
    BASE_URL: 'https://kitsu.io/api/edge',
  },
}
```

### Límites de Kitsu
- ✅ 300 requests por minuto
- ❌ Datos menos completos que AniList/MAL

## 🚀 Configuración Rápida

### Mínimo Requerido (solo AniList)

Si solo quieres importar rápido sin configurar nada:

```bash
# Importar desde AniList (no requiere credenciales)
npm run import run -- -s anilist -t anime -l 10000
npm run import run -- -s anilist -t manga -l 10000
```

**Ventajas**:
- ✅ No requiere configuración
- ✅ Más rápido (90 req/min)
- ✅ Datos más completos (banners, tags, relaciones)

**Desventajas**:
- ❌ No tendrás `mal_id` para cross-reference

### Configuración Completa (AniList + MAL)

Para máxima compatibilidad y datos cruzados:

1. **Obtener MAL Client ID** (pasos arriba)
2. **Actualizar config.ts**:
   ```typescript
   export const API_CREDENTIALS = {
     MAL: {
       CLIENT_ID: 'TU_CLIENT_ID_AQUI',
       CLIENT_SECRET: '',
       BASE_URL: 'https://api.myanimelist.net/v2',
     },
     ANILIST: {
       BASE_URL: 'https://graphql.anilist.co',
     },
   }
   ```

3. **Importar desde ambas fuentes**:
   ```bash
   # Primero AniList (más rápido, más datos)
   npm run import run -- -s anilist -t anime -l 20000
   
   # Luego MAL (para mal_id y datos adicionales)
   npm run import run -- -s mal -t anime -l 20000
   ```

**Resultado**:
- ✅ Máxima cobertura de datos
- ✅ IDs de ambas fuentes (`mal_id` y `anilist_id`)
- ✅ Datos más completos en `external_payload`

## 🔒 Seguridad

### ⚠️ IMPORTANTE

**NUNCA** commitees el archivo `config.ts` con tus credenciales reales a Git.

### Buenas Prácticas

1. **Opción 1: Variables de entorno** (recomendado para producción):
   ```typescript
   export const API_CREDENTIALS = {
     MAL: {
       CLIENT_ID: process.env.MAL_CLIENT_ID || 'YOUR_MAL_CLIENT_ID',
       CLIENT_SECRET: process.env.MAL_CLIENT_SECRET || '',
       BASE_URL: 'https://api.myanimelist.net/v2',
     },
   }
   ```

   Crear `.env.local`:
   ```
   MAL_CLIENT_ID=abc123def456ghi789
   MAL_CLIENT_SECRET=
   ```

2. **Opción 2: Archivo local no commiteado**:
   - Agregar `config.local.ts` a `.gitignore`
   - Importar credenciales desde ahí

3. **Opción 3: Hardcodear en config.ts** (más simple):
   - Útil para desarrollo local
   - Asegúrate de NO commitear

## 📊 Resumen

| API | Credenciales | Velocidad | Datos |
|-----|-------------|-----------|-------|
| **AniList** | ❌ No requiere | 90 req/min | ⭐⭐⭐⭐⭐ Muy completo |
| **MyAnimeList** | ✅ Client ID | 60 req/min | ⭐⭐⭐⭐ Completo |
| **Kitsu** | ❌ No requiere | 300 req/min | ⭐⭐⭐ Básico |

## ❓ Troubleshooting

### Error: "MAL Client ID no configurado"

**Causa**: CLIENT_ID no actualizado en config.ts

**Solución**: 
```typescript
CLIENT_ID: 'YOUR_MAL_CLIENT_ID', // ❌
CLIENT_ID: 'abc123def456', // ✅
```

### Error: "401 Unauthorized" con MAL

**Causa**: Client ID inválido o expirado

**Solución**: 
1. Verifica que copiaste el ID correctamente
2. Regenera el Client ID en MAL API Config
3. Actualiza config.ts

### Error: "429 Too Many Requests"

**Causa**: Excediste el rate limit

**Solución**: El sistema debería manejar esto automáticamente. Si persiste:
- Espera 1 minuto
- Continúa con `--resume`

## 📖 Referencias

- [MyAnimeList API Docs](https://myanimelist.net/apiconfig/references/api/v2)
- [AniList API Docs](https://anilist.gitbook.io/anilist-apiv2-docs/)
- [Kitsu API Docs](https://kitsu.docs.apiary.io/)
