const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('🚀 Ejecutando migración de temporadas/volúmenes/capítulos...\n');
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'create-seasons-volumes-chapters.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar la migración
    await pool.query(sql);
    
    console.log('✅ Migración completada exitosamente!\n');
    
    // Verificar las tablas creadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      AND table_name IN ('seasons', 'volumes', 'chapters')
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tablesQuery);
    console.log('📋 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`   - app.${row.table_name}`);
    });
    
    // Verificar columna season_id en episodes
    const columnQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'app' 
      AND table_name = 'episodes' 
      AND column_name = 'season_id';
    `;
    
    const columnResult = await pool.query(columnQuery);
    if (columnResult.rows.length > 0) {
      console.log('\n✅ Columna season_id agregada a app.episodes');
    }
    
    console.log('\n🎉 Todo listo!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    
    // Si el error es por tablas que ya existen, está OK
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Algunas tablas ya existían. La migración se completó parcialmente.');
    }
  } finally {
    await pool.end();
  }
}

runMigration();
