# 🔐 Guía de Usuario: Recuperación de Contraseña

## ¿Olvidaste tu contraseña?

No te preocupes, puedes recuperarla usando tu **Recovery Code** y tu aplicación de autenticación (Google Authenticator, Authy, etc.).

---

## 📋 Lo que necesitas

Para recuperar tu contraseña necesitarás:

1. **Recovery Code** (64 caracteres)
   - Te lo dimos cuando te registraste
   - Ejemplo: `a1b2c3d4e5f6...` (64 caracteres)
   - ⚠️ Si no lo guardaste, contacta al administrador

2. **Código de Autenticación**
   - **Opción A**: Código de 6 dígitos de tu app (Google Authenticator, Authy)
   - **Opción B**: Uno de tus códigos de respaldo guardados

3. **Nueva contraseña**
   - Mínimo 8 caracteres
   - Al menos una mayúscula
   - Al menos una minúscula
   - Al menos un número

---

## 🚀 Pasos para Recuperar tu Contraseña

### Paso 1: Ir a Recuperar Contraseña

1. Ve a la página de inicio de sesión
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. Serás redirigido a la página de recuperación

### Paso 2: Ingresar Recovery Code

1. Busca tu **Recovery Code** que guardaste al registrarte
   - Es un código de 64 caracteres hexadecimales
   - Ejemplo: `274de5fd18e6fd3d4faff047b8fc9ca000336fa282de7a96cd17e0e34aecf9fc`

2. Cópialo y pégalo en el campo **"Recovery Code"**

### Paso 3: Ingresar Código 2FA

**Opción A - Usar App de Autenticación** (recomendado):
1. Abre tu app de autenticación (Google Authenticator, Authy, etc.)
2. Busca la entrada de **Chirisu**
3. Ingresa el código de 6 dígitos
4. ⏱️ Tienes 30 segundos antes de que cambie

**Opción B - Usar Código de Respaldo**:
1. Si no tienes acceso a tu app de autenticación
2. Usa uno de los **códigos de respaldo** que guardaste
3. Ejemplo: `ABC123XYZ`
4. ⚠️ Los códigos de respaldo solo se pueden usar una vez

### Paso 4: Crear Nueva Contraseña

1. Ingresa tu nueva contraseña
   - Mínimo 8 caracteres
   - Debe incluir: mayúsculas, minúsculas y números
   - Ejemplo válido: `MiPassword123`

2. Confirma la contraseña (ingrésala de nuevo)

3. Haz clic en **"Restablecer"**

### Paso 5: Guardar Nuevo Recovery Code

✅ **¡MUY IMPORTANTE!**

Después de cambiar tu contraseña, recibirás un **NUEVO Recovery Code**.

**¿Por qué es importante?**
- Tu recovery code anterior ya no funciona
- Necesitarás el nuevo código si olvidas tu contraseña de nuevo
- Es la única forma de recuperar tu cuenta sin email

**Cómo guardarlo**:
1. Haz clic en el botón **"Copiar"**
2. Guárdalo en un lugar seguro:
   - 📱 App de notas segura (con contraseña)
   - 🔒 Administrador de contraseñas
   - 📄 Documento encriptado
   - 🗂️ En un lugar físico seguro (papel)

**NO lo guardes en**:
- ❌ Un archivo de texto sin protección
- ❌ Email sin encriptar
- ❌ Notas accesibles públicamente

### Paso 6: Iniciar Sesión

1. Haz clic en **"Ir a Iniciar Sesión"**
2. Ingresa tu **nueva contraseña**
3. Ingresa el código 2FA
4. ¡Listo! Ya estás dentro

---

## ⚠️ Problemas Comunes

### "Recovery code no encontrado o inválido"

**Posibles causas**:
- ❌ Copiaste el código incorrectamente
- ❌ Hay espacios al inicio o final
- ❌ Estás usando un recovery code antiguo

**Solución**:
1. Verifica que hayas copiado TODO el código (64 caracteres)
2. Asegúrate de no tener espacios
3. Si cambiaste tu contraseña antes, usa el recovery code MÁS RECIENTE
4. Si nada funciona, contacta al administrador

### "Código A2F o código de respaldo inválido"

**Posibles causas**:
- ❌ El código TOTP ya expiró (30 segundos)
- ❌ El código de respaldo ya se usó
- ❌ Ingresaste el código incorrectamente

**Solución**:
- Si usas TOTP: Espera a que genere un código nuevo
- Si usas backup code: Verifica que sea uno que no hayas usado
- Intenta con otro código de respaldo

### "Esta cuenta está desactivada"

**Causa**:
- Tu cuenta fue desactivada por un administrador

**Solución**:
- Contacta al equipo de soporte
- No puedes recuperar la contraseña hasta que reactiven tu cuenta

### "La contraseña debe tener al menos 8 caracteres"

**Causa**:
- Tu nueva contraseña es muy corta o débil

**Solución**:
- Usa al menos 8 caracteres
- Incluye mayúsculas: A-Z
- Incluye minúsculas: a-z
- Incluye números: 0-9
- Ejemplo válido: `Password123`

---

## 🎯 Consejos de Seguridad

### Para Recovery Codes

✅ **SÍ hacer**:
- Guardarlos en un administrador de contraseñas
- Hacer una copia física en lugar seguro
- Actualizarlos cuando cambies tu contraseña
- Guardarlos cifrados

❌ **NO hacer**:
- Compartirlos con nadie
- Guardarlos en texto plano sin protección
- Enviarlos por email o mensajería
- Subirlos a la nube sin encriptar

### Para Códigos de Respaldo

✅ **SÍ hacer**:
- Guardar todos los códigos cuando te registres
- Marcar los que ya usaste
- Regenerarlos cuando queden pocos (< 3)
- Guardarlos junto con tu recovery code

❌ **NO hacer**:
- Usar el mismo código dos veces (no funcionará)
- Perder todos tus códigos
- Compartirlos

### Para tu App de Autenticación

✅ **SÍ hacer**:
- Hacer backup del secret/QR code
- Usar apps confiables (Google Authenticator, Authy)
- Mantener el reloj de tu teléfono sincronizado
- Tener backup en otro dispositivo

❌ **NO hacer**:
- Eliminar la app sin tener backup
- Compartir tu secret code

---

## 📊 Estado de tus Códigos

### ¿Cuántos códigos de respaldo me quedan?

Después de recuperar tu contraseña con un código de respaldo, verás:

```
✅ Contraseña actualizada

Código de respaldo utilizado
Te quedan 7 códigos de respaldo.
```

**Interpretación**:
- 10-7 códigos: ✅ Estás bien
- 6-3 códigos: ⚠️ Considera regenerarlos pronto
- 2-1 códigos: 🚨 Regenera códigos urgente
- 0 códigos: ❌ Solo puedes usar TOTP

### ¿Cómo regenerar códigos de respaldo?

*(Función pendiente de implementar)*

Próximamente podrás regenerar tus códigos de respaldo desde:
- Tu perfil → Seguridad → Regenerar códigos de respaldo

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas para recuperar tu contraseña:

1. **Verifica primero**:
   - ¿Tienes tu recovery code?
   - ¿Tienes acceso a tu app 2FA o códigos de respaldo?
   - ¿Tu cuenta está activa?

2. **Si perdiste todo**:
   - Recovery code perdido → Contacta al administrador
   - App 2FA perdida + códigos de respaldo perdidos → Contacta al administrador
   - Solo códigos de respaldo perdidos → Puedes usar tu app 2FA

3. **Contacto**:
   - Email: soporte@chirisu.com *(cuando esté disponible)*
   - Discord: *(cuando esté disponible)*
   - Formulario de contacto: *(cuando esté disponible)*

---

## ✅ Checklist de Recuperación

Antes de recuperar tu contraseña, asegúrate de tener:

- [ ] Recovery Code (64 caracteres)
- [ ] App de autenticación funcionando **O** códigos de respaldo
- [ ] Nueva contraseña pensada (8+ chars, mayúsculas, minúsculas, números)
- [ ] Lugar seguro para guardar el nuevo recovery code

Después de recuperar tu contraseña, asegúrate de:

- [ ] Guardar el nuevo recovery code
- [ ] Anotar cuántos códigos de respaldo quedan
- [ ] Regenerar códigos si quedan pocos
- [ ] Probar el inicio de sesión con la nueva contraseña

---

**Última actualización**: 8 de Noviembre, 2025
