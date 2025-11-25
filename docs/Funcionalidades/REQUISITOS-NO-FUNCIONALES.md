# Requisitos No Funcionales del Proyecto Chirisu

## Tabla de Contenidos
1. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
2. [Rendimiento](#rendimiento)
3. [Seguridad](#seguridad)
4. [Escalabilidad](#escalabilidad)
5. [Disponibilidad y Confiabilidad](#disponibilidad-y-confiabilidad)
6. [Usabilidad](#usabilidad)
7. [Mantenibilidad](#mantenibilidad)
8. [Compatibilidad](#compatibilidad)
9. [Estándares y Cumplimiento](#estándares-y-cumplimiento)
10. [Documentación](#documentación)

---

## Arquitectura y Tecnologías

### Frontend

#### Framework Principal
- **Next.js 15.3.3**
  - React Server Components por defecto
  - App Router (App Directory)
  - Turbopack para desarrollo
  - Renderizado híbrido (SSR, SSG, CSR según necesidad)

#### Lenguaje
- **TypeScript 5.x**
  - Type safety completo
  - Interfaces para todas las entidades
  - Tipos estrictos habilitados

#### UI/Styling
- **Tailwind CSS**
  - Utility-first CSS framework
  - Configuración personalizada de tema
  - Responsive design por defecto

- **shadcn/ui**
  - Componentes de UI reutilizables
  - Basados en Radix UI
  - Totalmente personalizables

- **Lucide React**
  - Iconos SVG modernos
  - Tree-shakeable
  - Peso ligero

#### Gestión de Estado
- **React Context API**
  - AuthContext para autenticación
  - Contextos específicos por funcionalidad
  - Minimal re-renders

#### Formularios y Validación
- **React Hook Form** (futuro)
- **Zod** para validación de schemas (futuro)

### Backend

#### Base de Datos
- **PostgreSQL 17**
  - Base de datos relacional robusta
  - Schema: `app`
  - Nombre: `bd_chirisu`
  - Puerto: 5432

#### Características de BD
- **Triggers automáticos**
  - Actualización de contadores
  - Otorgamiento de puntos
  - Cálculo de niveles
  - Soft deletes

- **Funciones PL/pgSQL**
  - `fn_award_points()`: Otorgar puntos y actualizar nivel
  - `fn_calculate_level()`: Calcular nivel basado en puntos
  - Funciones de validación y triggers

- **Índices optimizados**
  - Índices en columnas de búsqueda frecuente
  - Índices compuestos para queries complejas
  - Índices en foreign keys

#### API Routes
- **Next.js API Routes**
  - RESTful endpoints
  - Estructura organizada por recurso
  - Manejo centralizado de errores

#### Autenticación
- **JWT (JSON Web Tokens)**
  - Tokens con expiración de 24 horas
  - Cookie segura: `chirisu_session`
  - HttpOnly, Secure, SameSite

- **bcrypt**
  - Hash de contraseñas con salt rounds: 10
  - Verificación segura de contraseñas

### Gestión de Conexiones

#### Pool de Conexiones PostgreSQL
```typescript
const pool = new Pool({
  max: 20,                    // Máximo 20 conexiones
  idleTimeoutMillis: 30000,   // Timeout de 30 segundos
  connectionTimeoutMillis: 2000 // Timeout de conexión 2 segundos
})
```

---

## Rendimiento

### Optimización de Queries

#### Caching
- **Revalidación automática**
  - `revalidate: 3600` (1 hora) para datos semi-estáticos
  - `revalidate: 60` para datos frecuentemente actualizados
  - Cache de Next.js para rutas estáticas

#### Lazy Loading
- Comentarios con carga diferida
- Respuestas anidadas cargadas bajo demanda
- Imágenes con lazy loading nativo

#### Paginación
- Limit/Offset en todas las listas
- Página por defecto: 20 items
- Máximo configurable: 100 items

### Optimización de Imágenes
- **Next.js Image Component**
  - Optimización automática
  - WebP cuando es soportado
  - Lazy loading por defecto
  - Responsive images

### Minimización de Re-renders
- **Server Components cuando es posible**
  - Reducción de JavaScript enviado al cliente
  - Solo Client Components para interactividad

- **Client Components mínimos**
  - `'use client'` solo cuando es necesario
  - Event handlers aislados en componentes pequeños
  - Ejemplo: UserAvatar, CharacterImage

### Métricas de Rendimiento Objetivo
- **First Contentful Paint (FCP):** < 1.5 segundos
- **Largest Contentful Paint (LCP):** < 2.5 segundos
- **Time to Interactive (TTI):** < 3.5 segundos
- **Total Blocking Time (TBT):** < 300 ms

---

## Seguridad

### Autenticación y Autorización

#### Validación de Tokens
- Verificación en cada request protegido
- Expiración de tokens: 24 horas
- Refresh automático (futuro)

#### Roles y Permisos
- **Verificación en servidor**
  ```typescript
  const user = await getCurrentUser();
  if (!user.isAdmin && !user.isModerator) {
    return Response 403 Forbidden
  }
  ```

- **Niveles de acceso:**
  - Usuario regular
  - Moderador
  - Administrador

### Protección de Datos

#### Contraseñas
- **bcrypt hash**
  - Salt rounds: 10
  - Nunca almacenadas en texto plano
  - Nunca devueltas en respuestas

#### SQL Injection Prevention
- **Prepared Statements**
  - Todas las queries usan placeholders ($1, $2, etc.)
  - Nunca concatenación de strings en SQL
  ```typescript
  pool.query('SELECT * FROM users WHERE id = $1', [userId])
  ```

#### XSS Prevention
- **Sanitización de inputs**
  - Validación de tipos
  - Límites de caracteres
  - Escape de HTML cuando es necesario

#### CSRF Protection
- **SameSite cookies**
  - `SameSite=Lax` por defecto
  - Tokens CSRF para acciones críticas (futuro)

### Validación de Datos

#### Server-Side Validation
Todas las validaciones en servidor:
- Tipos de datos
- Rangos de valores
- Formatos (email, URLs, etc.)
- Longitudes mínimas y máximas

#### Client-Side Validation
Validación adicional para UX:
- Feedback inmediato
- Prevención de requests inválidos
- No se confía exclusivamente en ella

### Rate Limiting (Futuro)
- Límite de requests por IP
- Límite de acciones por usuario
- Protección contra fuerza bruta

### Auditoría y Logging
- Registro de acciones críticas
- Logs de errores con contexto
- Sin exposición de información sensible en logs

---

## Escalabilidad

### Diseño de Base de Datos

#### Normalización
- Tercera forma normal (3NF)
- Relaciones polimórficas para flexibilidad
- Foreign keys para integridad referencial

#### Soft Deletes
- Columna `deleted_at` en tablas principales
- Preservación de datos para auditoría
- Filtrado automático en queries

#### Particionamiento (Futuro)
- Particionamiento de tablas grandes por fecha
- Archivado de datos antiguos

### Arquitectura Stateless
- No sesiones en memoria
- JWT para autenticación
- Escalamiento horizontal posible

### Caching Strategy

#### Niveles de Cache
1. **Browser Cache**
   - Assets estáticos
   - Imágenes optimizadas

2. **Next.js Cache**
   - Páginas estáticas
   - API responses con revalidate

3. **Database Cache** (Futuro)
   - Redis para datos frecuentes
   - Sessions storage
   - Rate limiting

### CDN (Futuro)
- Distribución de assets estáticos
- Imágenes de medios
- Reducción de latencia global

### Load Balancing (Futuro)
- Múltiples instancias de aplicación
- Balance de carga en base de datos
- Health checks automáticos

---

## Disponibilidad y Confiabilidad

### Manejo de Errores

#### Try-Catch Comprehensivo
```typescript
try {
  // Operación de BD
  const result = await pool.query(...)
} catch (error) {
  console.error('Error context:', error)
  return NextResponse.json(
    { error: 'Mensaje amigable' },
    { status: 500 }
  )
}
```

#### Respuestas de Error Estandarizadas
```typescript
{
  error: "Mensaje de error",
  details: "Detalles adicionales (solo en desarrollo)",
  code: "ERROR_CODE" // Futuro
}
```

### Recuperación de Fallos

#### Transacciones de Base de Datos
- BEGIN/COMMIT para operaciones críticas
- ROLLBACK automático en errores
- Consistencia de datos garantizada

#### Fallbacks
- Imágenes con fallback a iniciales
- Datos con valores por defecto
- Graceful degradation

### Monitoreo (Futuro)

#### Health Checks
- Endpoint `/api/health`
- Verificación de BD
- Verificación de servicios externos

#### Alertas
- Notificaciones de errores críticos
- Monitoreo de uptime
- Logs centralizados

### Backup

#### Base de Datos
- Backups automáticos diarios
- Retención de 30 días
- Punto de recuperación < 24 horas

#### Código
- Git como sistema de control de versiones
- GitHub como repositorio remoto
- Branches para features

---

## Usabilidad

### Diseño Responsive

#### Breakpoints
```css
sm: 640px   // Móviles grandes
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Pantallas grandes
```

#### Mobile-First
- Diseño pensado primero para móviles
- Progressive enhancement para pantallas grandes
- Touch-friendly interfaces

### Accesibilidad (a11y)

#### Semántica HTML
- Uso correcto de tags semánticos
- Estructura lógica de heading (h1, h2, etc.)
- Landmarks ARIA cuando es necesario

#### Contraste de Colores
- Cumplimiento WCAG 2.1 nivel AA
- Ratio de contraste mínimo 4.5:1 para texto
- Modo oscuro con contraste adecuado

#### Navegación por Teclado
- Tab order lógico
- Focus visible en elementos interactivos
- Skip links para navegación rápida

#### Screen Readers
- Alt text en imágenes
- ARIA labels en elementos interactivos
- Anuncios de cambios dinámicos

### Internacionalización (i18n)

#### Preparación para Múltiples Idiomas
- Estructura para archivos de traducción
- date-fns con locales (español actual)
- Formato de fechas localizado

#### Idiomas Objetivo (Futuro)
- Español (ES)
- Inglés (EN)
- Portugués (PT-BR)
- Japonés (JP)

### UX Patterns

#### Loading States
- Spinners durante carga
- Skeleton screens para contenido
- Feedback visual inmediato

#### Empty States
- Mensajes claros cuando no hay datos
- Sugerencias de acciones
- Ilustraciones amigables

#### Error States
- Mensajes de error claros
- Sugerencias de solución
- Opción de reintentar

#### Success Feedback
- Toasts para confirmaciones
- Animaciones sutiles
- Mensajes descriptivos

---

## Mantenibilidad

### Estructura de Código

#### Organización de Carpetas
```
src/
├── app/                 # App Router pages y API routes
│   ├── api/            # API endpoints
│   ├── (routes)/       # Páginas de la aplicación
│   └── layout.tsx      # Layout principal
├── components/         # Componentes React
│   ├── ui/            # Componentes de UI base
│   ├── comments/      # Sistema de comentarios
│   ├── moderation/    # Componentes de moderación
│   └── ...
├── lib/               # Utilidades y configuración
│   ├── types.ts       # TypeScript interfaces
│   ├── utils.ts       # Funciones helper
│   ├── database.ts    # Pool de PostgreSQL
│   └── auth.ts        # Utilidades de auth
├── context/           # React Contexts
└── hooks/             # Custom React Hooks
```

#### Convenciones de Nombrado
- **Archivos:** kebab-case (mi-componente.tsx)
- **Componentes:** PascalCase (MiComponente)
- **Funciones:** camelCase (miFuncion)
- **Constantes:** UPPER_SNAKE_CASE (MI_CONSTANTE)
- **Tipos/Interfaces:** PascalCase (MiInterface)

### Documentación de Código

#### Comentarios JSDoc
```typescript
/**
 * @fileoverview Descripción del archivo
 * 
 * Detalles adicionales sobre el propósito
 * y funcionalidad del archivo
 */

/**
 * Descripción de la función
 * @param userId - ID del usuario
 * @param points - Cantidad de puntos
 * @returns Promise con resultado
 */
async function awardPoints(userId: number, points: number): Promise<void>
```

#### README por Módulo
- Explicación de funcionalidades complejas
- Ejemplos de uso
- Dependencias y setup

### Testing (Futuro)

#### Unit Tests
- Jest para testing
- React Testing Library
- Cobertura objetivo: >80%

#### Integration Tests
- Testing de API routes
- Testing de flujos completos
- Mock de base de datos

#### E2E Tests
- Playwright o Cypress
- Flujos críticos de usuario
- Ambiente de staging

### Control de Versiones

#### Git Workflow
- Main branch protegida
- Feature branches para desarrollo
- Pull requests obligatorios
- Code review antes de merge

#### Commit Messages
```
feat: Agregar sistema de comentarios
fix: Corregir error en cálculo de puntos
docs: Actualizar documentación de API
refactor: Optimizar queries de comentarios
```

### Logs y Debugging

#### Console Logs Estructurados
```typescript
console.log('🔍 MediaPageClient - Cargando:', url)
console.log('✅ Data recibida:', data)
console.error('❌ Error loading media:', err)
```

#### Emojis para Categorización
- 🔍 Debug/Info
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 📊 Query/Database
- ⚡ Performance

---

## Compatibilidad

### Navegadores Soportados

#### Desktop
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

#### Mobile
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+

### Dispositivos

#### Resoluciones Mínimas
- Móvil: 320px de ancho
- Tablet: 768px de ancho
- Desktop: 1024px de ancho

#### Orientaciones
- Portrait (vertical)
- Landscape (horizontal)
- Adaptación automática

### Tecnologías Web

#### JavaScript
- ES2020+ features
- Transpilado para compatibilidad
- Polyfills cuando es necesario

#### CSS
- CSS Grid
- Flexbox
- Custom Properties (variables CSS)
- Autoprefixer para vendor prefixes

---

## Estándares y Cumplimiento

### Estándares Web

#### HTML5
- Validación W3C
- Semántica correcta
- Accesibilidad incorporada

#### CSS3
- BEM methodology (parcial)
- Utility-first con Tailwind
- Mobile-first approach

#### JavaScript/TypeScript
- ESLint para linting
- Prettier para formateo
- Airbnb style guide (base)

### Performance Best Practices

#### Core Web Vitals
- LCP optimizado
- FID minimizado
- CLS controlado

#### Lighthouse Scores Objetivo
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### GDPR y Privacidad (Futuro)

#### Datos Personales
- Consentimiento explícito
- Derecho al olvido
- Portabilidad de datos
- Transparencia en uso

#### Cookies
- Banner de consentimiento
- Categorización de cookies
- Opt-out disponible

---

## Documentación

### Documentación de Usuario (Futuro)

#### Guías de Uso
- Tutorial inicial
- FAQ
- Video tutoriales
- Tooltips contextuales

#### Ayuda en Línea
- Chat de soporte
- Centro de ayuda
- Documentación searchable

### Documentación Técnica

#### API Documentation
- Endpoints documentados
- Ejemplos de requests/responses
- Códigos de error
- Rate limits

#### Database Schema
- Diagrama ER
- Descripción de tablas
- Relaciones documentadas
- Triggers y funciones

#### Deployment Guide
- Requisitos del sistema
- Pasos de instalación
- Configuración de ambiente
- Variables de entorno

### Changelog

#### Versionado Semántico
- MAJOR.MINOR.PATCH
- Changelog detallado
- Breaking changes destacados
- Migration guides

---

## Variables de Entorno

### Requeridas

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bd_chirisu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bd_chirisu
DB_USER=postgres
DB_PASSWORD=123456

# Auth
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:9002
NODE_ENV=development

# Puerto de desarrollo
PORT=9002
```

### Opcionales (Futuro)

```env
# Redis (caching)
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Upload
AWS_S3_BUCKET=chirisu-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Analytics
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## Configuración de Desarrollo

### Requisitos del Sistema

#### Software Necesario
- Node.js 18+ o 20+
- PostgreSQL 17
- Git
- npm o yarn

#### Sistema Operativo
- Windows 10/11
- macOS 11+
- Linux (Ubuntu 20.04+, etc.)

### Setup Local

#### 1. Clonar Repositorio
```bash
git clone https://github.com/PierreArriagada/Chirisu.git
cd Chirisu
```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Configurar Base de Datos
```bash
psql -U postgres
CREATE DATABASE bd_chirisu;
\c bd_chirisu
# Ejecutar scripts SQL de estructura
```

#### 4. Variables de Entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

#### 5. Iniciar Desarrollo
```bash
npm run dev
# Aplicación en http://localhost:9002
```

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo con Turbopack

# Producción
npm run build        # Crea build de producción
npm run start        # Inicia servidor de producción

# Linting y Formateo
npm run lint         # Ejecuta ESLint
npm run format       # Formatea código con Prettier

# Database
npm run db:migrate   # Ejecuta migraciones (futuro)
npm run db:seed      # Seed de datos (futuro)
```

---

Esta documentación cubre todos los aspectos no funcionales del proyecto Chirisu, desde la arquitectura técnica hasta las mejores prácticas de desarrollo y deployment.
