# 🔐 Guía: Actualizar Hash de Contraseñas

## ✅ Roles Confirmados

El sistema incluye exactamente **3 roles**:

1. **admin** - Administrador (control total)
2. **moderator** - Moderador (gestión de contenido)
3. **user** - Usuario regular (permisos básicos)

---

## 📝 Pasos para Actualizar Hash de Contraseñas

### Opción 1: Generar Hash con Node.js (Recomendado)

#### Método A: Comando Directo en PowerShell

```powershell
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TuContraseña123!', 10, (err, hash) => { console.log('Hash:', hash); });"
```

**Ejemplo de salida:**
```
Hash: $2b$10$BE9S4VGt9DEpwu.pjEnTGurD30UJQuXlZpf7fbYNm/yqdzBc80S9C
```

#### Método B: Usar el script `generate-hash.js`

1. **Editar la contraseña en el archivo:**
```javascript
// generate-hash.js
const bcrypt = require('bcryptjs');

// 👇 CAMBIAR ESTA CONTRASEÑA
const password = 'TuNuevaContraseña123!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error generando hash:', err);
    return;
  }
  
  console.log('✅ Hash generado correctamente:');
  console.log('');
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('Copia este hash y úsalo en el script SQL');
});
```

2. **Ejecutar el script:**
```powershell
node generate-hash.js
```

3. **Copiar el hash generado**

---

### Opción 2: Online (NO Recomendado para producción)

Puedes usar herramientas online como:
- https://bcrypt-generator.com/
- https://bcrypt.online/

**⚠️ ADVERTENCIA:** No uses contraseñas reales en sitios web públicos.

---

## 🔄 Actualizar el Script SQL

### 1. Abrir el archivo `INIT-ROLES-PERMISOS.sql`

### 2. Buscar la sección de usuario admin (línea ~131):

```sql
INSERT INTO app.users (
  email, 
  password_hash, 
  username, 
  display_name,
  is_active
) VALUES (
  'admin@chirisu.com',
  '$2a$10$rQJvNhm5x5GGFvQ3KZEZAuxLgNK6Y2kz8VwL7h3qk8fF.GZMJxNLu', -- 👈 REEMPLAZAR ESTE HASH
  'admin',
  'Administrador',
  TRUE
)
```

### 3. Reemplazar el hash con el nuevo:

```sql
'$2b$10$BE9S4VGt9DEpwu.pjEnTGurD30UJQuXlZpf7fbYNm/yqdzBc80S9C', -- Admin123!
```

---

## ⚡ Ejemplo Completo: Generar Múltiples Hash

Si necesitas crear varios usuarios (admin, moderador, usuario de prueba):

```javascript
// generate-multiple-hashes.js
const bcrypt = require('bcryptjs');

const passwords = [
  { user: 'admin', pass: 'Admin123!' },
  { user: 'moderator', pass: 'Mod123!' },
  { user: 'testuser', pass: 'User123!' }
];

passwords.forEach(({ user, pass }) => {
  bcrypt.hash(pass, 10, (err, hash) => {
    if (err) {
      console.error(`❌ Error con ${user}:`, err);
      return;
    }
    console.log(`\n✅ ${user.toUpperCase()}`);
    console.log(`Email: ${user}@chirisu.com`);
    console.log(`Contraseña: ${pass}`);
    console.log(`Hash: ${hash}`);
  });
});
```

---

## 🎯 Hash Generados de Ejemplo

### Usuario Admin
```
Email: admin@chirisu.com
Contraseña: Admin123!
Hash: $2b$10$BE9S4VGt9DEpwu.pjEnTGurD30UJQuXlZpf7fbYNm/yqdzBc80S9C
```

### Usuario Moderador (ejemplo)
```
Email: moderator@chirisu.com
Contraseña: Mod123!
Hash: [Generar con el comando de arriba]
```

### Usuario Regular (ejemplo)
```
Email: user@chirisu.com
Contraseña: User123!
Hash: [Generar con el comando de arriba]
```

---

## 📋 Checklist de Actualización

- [ ] Generar hash con bcrypt (rounds: 10)
- [ ] Copiar el hash generado
- [ ] Abrir `docs/INIT-ROLES-PERMISOS.sql`
- [ ] Reemplazar el hash en la línea 131
- [ ] Verificar que el hash esté entre comillas simples
- [ ] Guardar el archivo
- [ ] Ejecutar el script SQL en PostgreSQL
- [ ] Probar login con las nuevas credenciales

---

## 🔍 Verificar Hash en la Base de Datos

Después de ejecutar el script, verificar:

```sql
-- Ver el usuario admin
SELECT id, email, username, password_hash, is_active 
FROM app.users 
WHERE email = 'admin@chirisu.com';

-- Verificar sus roles
SELECT u.email, r.name, r.display_name
FROM app.users u
JOIN app.user_roles ur ON u.id = ur.user_id
JOIN app.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@chirisu.com';
```

---

## ⚠️ Importante: Seguridad

1. **NUNCA** subir contraseñas en texto plano a Git
2. **SIEMPRE** usar bcrypt con al menos 10 rounds
3. **CAMBIAR** las contraseñas de ejemplo en producción
4. **USAR** contraseñas fuertes (mínimo 8 caracteres, mayúsculas, minúsculas, números, símbolos)
5. **NO** compartir el hash de producción públicamente

---

## 🚀 Siguiente Paso

Una vez actualizado el hash en el script SQL:

```powershell
# 1. Conectar a PostgreSQL y ejecutar el script
psql -U postgres -d bd_chirisu -f "docs/INIT-ROLES-PERMISOS.sql"

# O usar pgAdmin/DBeaver para ejecutar el contenido del archivo
```

**Luego probar el login en:** http://localhost:3000/login
