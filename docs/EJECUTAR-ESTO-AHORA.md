# 🚨 INSTRUCCIONES URGENTES - Ejecutar Manualmente

## Problema Actual

El trigger `auto_generate_slug()` todavía tiene la versión antigua que llama a `generate_slug(title, id)` con 2 parámetros.

## ✅ Solución: Ejecutar script manualmente

### Paso 1: Abrir nueva terminal PowerShell

**NO uses la terminal donde corre `npm run dev`**

1. Presiona `Windows + R`
2. Escribe: `powershell`
3. Enter

### Paso 2: Cambiar codificación

```powershell
chcp 65001
```

### Paso 3: Navegar a la carpeta

```powershell
cd "C:\Users\boris\OneDrive\Documentos\Chirisu"
```

### Paso 4: Ejecutar script de limpieza

```powershell
psql -U postgres -d bd_chirisu -f "docs\LIMPIEZA-COMPLETA-TRIGGERS.sql"
```

Ingresa la contraseña de PostgreSQL cuando te la pida.

### Paso 5: Verificar resultado

Deberías ver al final:

```
✅ Limpieza y recreacion completa exitosa!
```

Y verificaciones como:

```
Funcion generate_slug | num_parametros: 1 | parametros: title text
Triggers activos: anime, manga, novels
```

### Paso 6: Volver a intentar aprobar

Ve a: http://localhost:9002/dashboard/moderator/contributions/1

Click en "Aprobar Contribución"

---

## 🔍 Si sigue sin funcionar

Ejecuta este comando en psql para ver la definición del trigger:

```sql
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger
WHERE tgname = 'auto_generate_slug'
  AND tgrelid = 'app.anime'::regclass;
```

Si ves `NEW.id` en la definición, el trigger NO se actualizó correctamente.

---

## 📝 Alternativa: Ejecutar desde pgAdmin

1. Abrir pgAdmin
2. Conectar a bd_chirisu
3. Click derecho → Query Tool
4. Abrir `docs\LIMPIEZA-COMPLETA-TRIGGERS.sql`
5. Presionar F5

---

**¡Es importante ejecutarlo en una terminal NUEVA de PowerShell, no en la de npm!**
