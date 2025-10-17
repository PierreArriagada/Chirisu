// Script para generar hash de contraseñas bcrypt
const bcrypt = require('bcryptjs');

// Cambiar esta contraseña por la que quieras
const password = 'Admin123!';

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
