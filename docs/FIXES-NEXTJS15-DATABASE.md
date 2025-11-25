# 🔧 CORRECCIONES DE ERRORES - Next.js 15 & Database

## 📋 **Errores Corregidos**

### **Error 1: `params` debe ser awaited (Next.js 15)**

**Síntoma:**
```
Error: Route "/api/moderation/contributions/[id]" used `params.id`. 
`params` should be awaited before using its properties.
```

**Causa:**
En Next.js 15, los route params son asíncronos y deben ser awaited antes de usarse.

**Solución:**

**ANTES:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contributionId = parseInt(params.id); // ❌ Error
}
```

**DESPUÉS:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Correcto
  const contributionId = parseInt(id);
}
```

**Archivos Modificados:**
- `src/app/api/moderation/contributions/[id]/route.ts` (GET y PATCH)

---

### **Error 2: `db.connect()` no existe**

**Síntoma:**
```
TypeError: db.connect is not a function
```

**Causa:**
El módulo `db` exportado desde `src/lib/database.ts` NO tiene un método `connect()`. Solo exporta:
- `query()`
- `withTransaction()`
- `pool`

**Solución:**

**ANTES:**
```typescript
export async function PATCH(...) {
  const client = await db.connect(); // ❌ No existe
  
  try {
    await client.query('BEGIN');
    // ... operaciones ...
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}
```

**DESPUÉS:**
```typescript
export async function PATCH(...) {
  try {
    const result = await db.withTransaction(async (client) => {
      // Todas las operaciones con client aquí
      // COMMIT automático si todo sale bien
      // ROLLBACK automático si hay error
      
      if (action === 'approve') {
        // ... crear anime ...
        return {
          success: true,
          message: 'Contribución aprobada',
          animeId: animeId.toString(),
        };
      } else if (action === 'reject') {
        // ... rechazar ...
        return {
          success: true,
          message: 'Contribución rechazada',
        };
      }
      
      return null;
    });

    if (result) {
      return NextResponse.json(result);
    }
    
  } catch (error) {
    // Error ya manejado por withTransaction
    return NextResponse.json({ error: '...' }, { status: 500 });
  }
}
```

**Ventajas de `withTransaction()`:**
- ✅ `BEGIN` automático
- ✅ `COMMIT` automático si todo sale bien
- ✅ `ROLLBACK` automático si hay error
- ✅ `client.release()` automático
- ✅ Código más limpio

---

## 📁 **Archivos Modificados**

### **`src/app/api/moderation/contributions/[id]/route.ts`**

**Cambios:**
1. **GET**: `params` ahora es `Promise<{ id: string }>`
2. **GET**: `await params` antes de usar `params.id`
3. **PATCH**: `params` ahora es `Promise<{ id: string }>`
4. **PATCH**: `await params` antes de usar `params.id`
5. **PATCH**: Reemplazado todo el bloque de transacción manual por `db.withTransaction()`
6. **PATCH**: Eliminado `db.connect()`, `client.query('BEGIN')`, `COMMIT`, `ROLLBACK`, `client.release()`
7. **PATCH**: Lógica de aprobación/rechazo ahora retorna objetos en vez de `NextResponse`
8. **PATCH**: Un solo `try/catch` fuera de la transacción

---

## 🧪 **Pruebas**

### **Probar Aprobación de Contribución:**

1. **Enviar una contribución**:
   - Ir a: http://localhost:9002/contribution-center/add-anime
   - Llenar formulario y enviar

2. **Ver en panel de moderación**:
   - Ir a: http://localhost:9002/dashboard/moderator/contributions
   - Ver contribución en tab "Pendiente"
   - Click en "Revisar"

3. **Aprobar**:
   - Click en botón verde "Aprobar Contribución"
   - **Verificar en logs del servidor**:
     ```
     🔄 Aprobando contribución y creando anime...
     ✅ Anime creado con ID: X
     ✅ X géneros asociados
     ✅ X estudios asociados
     ✅ X miembros del staff asociados
     ✅ X personajes asociados
     ✅ Contribución X aprobada exitosamente
     ```

4. **Verificar en base de datos**:
   ```sql
   -- Ver anime creado
   SELECT * FROM app.anime ORDER BY created_at DESC LIMIT 1;
   
   -- Ver contribución aprobada
   SELECT * FROM app.user_contributions 
   WHERE status = 'approved' 
   ORDER BY reviewed_at DESC LIMIT 1;
   
   -- Ver notificación al usuario
   SELECT * FROM app.notifications 
   WHERE action_type = 'contribution_approved' 
   ORDER BY created_at DESC LIMIT 1;
   ```

### **Probar Rechazo de Contribución:**

1. **Enviar otra contribución**
2. **Ir al panel de moderación**
3. **Rechazar**:
   - Click en botón rojo "Rechazar Contribución"
   - Escribir motivo: "Faltan datos importantes"
   - Confirmar

4. **Verificar en logs**:
   ```
   ✅ Contribución X rechazada
   ```

5. **Verificar en base de datos**:
   ```sql
   SELECT 
     id, 
     status, 
     rejection_reason, 
     reviewed_at 
   FROM app.user_contributions 
   WHERE status = 'rejected' 
   ORDER BY reviewed_at DESC LIMIT 1;
   ```

---

## 🔍 **API de Database (`src/lib/database.ts`)**

### **Métodos Disponibles:**

```typescript
import { db } from '@/lib/database';

// 1. Query simple
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// 2. Transacción (recomendado para múltiples operaciones)
await db.withTransaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO lists ...');
  // Si cualquier query falla, ROLLBACK automático
  // Si todo sale bien, COMMIT automático
});

// 3. Acceso directo al pool (usar solo si necesitas)
const client = await db.pool.connect();
try {
  // ...
} finally {
  client.release();
}
```

### **Cuándo Usar Cada Método:**

**`db.query()`:**
- ✅ Queries simples de lectura
- ✅ Un solo INSERT/UPDATE/DELETE
- ✅ No necesitas transacción

**`db.withTransaction()`:**
- ✅ Múltiples operaciones que deben ser atómicas
- ✅ Crear registro + asociaciones
- ✅ Actualizar múltiples tablas
- ✅ Cualquier operación que deba ser "todo o nada"

**`db.pool.connect()`:**
- ⚠️ Solo en casos muy específicos
- ⚠️ Debes manejar `client.release()` manualmente
- ⚠️ Debes manejar transacciones manualmente

---

## ✅ **Resumen**

**Correcciones Aplicadas:**
1. ✅ `params` ahora se hace `await` en ambos endpoints (GET y PATCH)
2. ✅ Reemplazado `db.connect()` por `db.withTransaction()`
3. ✅ Eliminado manejo manual de transacciones
4. ✅ Código más limpio y seguro

**Beneficios:**
- ✅ Compatible con Next.js 15
- ✅ Transacciones más seguras (auto ROLLBACK)
- ✅ Menos código boilerplate
- ✅ No más memory leaks por `client.release()` olvidado

**Estado:**
- ✅ Sin errores de compilación
- ✅ Listo para probar en el navegador

---

## 🚀 **Siguiente Paso**

Reinicia el servidor si está corriendo y prueba el flujo completo de aprobación/rechazo:

```bash
npm run dev
```

Luego:
1. Enviar contribución
2. Ver notificación en navbar
3. Ir al panel de moderación
4. Aprobar/Rechazar
5. Verificar que el anime se crea correctamente
6. Verificar que el usuario recibe notificación

**¡El sistema está corregido y listo para usar! 🎉**
