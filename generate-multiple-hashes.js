// cleaScript para generar hash de múltiples usuarios
const bcrypt = require('bcryptjs');

const users = [
  { role: 'admin', email: 'admin@chirisu.com', password: 'Admin123!' },
  { role: 'moderator', email: 'moderator.user@example.com', password: 'Mod123!' },
  { role: 'user', email: 'juan.perez@example.com', password: 'User123!' }
];

console.log('\n🔐 Generando hashes bcrypt para usuarios...\n');
console.log('='.repeat(70));

let completed = 0;

users.forEach(({ role, email, password }) => {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(`\n❌ Error generando hash para ${role}:`, err);
      return;
    }
    
    console.log(`\n✅ ${role.toUpperCase()}`);
    console.log(`   Email:      ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Hash:       ${hash}`);
    console.log('-'.repeat(70));
    
    completed++;
    
    if (completed === users.length) {
      console.log('\n✅ Todos los hashes generados correctamente');
      console.log('\nCopia los hashes y úsalos en tu script SQL\n');
    }
  });
});
