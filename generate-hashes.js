/**
 * ========================================
 * SCRIPT: GENERAR HASHES BCRYPT
 * ========================================
 * 
 * Ejecutar:
 * node generate-hashes.js
 * 
 * Luego copiar los hashes en database/seeds/01_users.sql
 */

const bcrypt = require('bcryptjs');

const passwords = [
  { email: 'admin@example.com', password: 'adminpassword' },
  { email: 'moderator@example.com', password: 'modpassword' },
  { email: 'user@example.com', password: 'userpassword' }
];

console.log('🔐 Generando hashes bcrypt...\n');

async function generateHashes() {
  for (const { email, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${email}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash: ${hash}`);
    console.log('');
  }
  
  console.log('✅ Copiar estos hashes en database/seeds/01_users.sql');
}

generateHashes();
