// Script para verificar datos de anime y manga en la BD
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

console.log('🔧 Configuración de BD:');
console.log('  Host:', process.env.POSTGRES_HOST);
console.log('  Database:', process.env.POSTGRES_DATABASE);
console.log('  User:', process.env.POSTGRES_USER);
console.log('');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  options: `-c search_path=app,public`,
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');
    
    // 1. Verificar anime
    console.log('📺 === ANIME ===');
    const animeResult = await pool.query(`
      SELECT 
        id,
        title_romaji,
        title_english,
        is_published,
        deleted_at,
        created_at,
        average_score
      FROM app.anime
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (animeResult.rows.length === 0) {
      console.log('❌ No hay animes en la base de datos');
    } else {
      console.log(`✅ Total de animes encontrados: ${animeResult.rows.length}`);
      animeResult.rows.forEach((anime, index) => {
        console.log(`\n  ${index + 1}. ${anime.title_romaji || anime.title_english || 'Sin título'}`);
        console.log(`     ID: ${anime.id}`);
        console.log(`     Publicado: ${anime.is_published ? '✅ Sí' : '❌ No'}`);
        console.log(`     Eliminado: ${anime.deleted_at ? '🗑️ Sí' : '✅ No'}`);
        console.log(`     Score: ${anime.average_score || 0}`);
        console.log(`     Creado: ${anime.created_at}`);
      });
    }
    
    // 2. Verificar manga
    console.log('\n\n📖 === MANGA ===');
    const mangaResult = await pool.query(`
      SELECT 
        id,
        title_romaji,
        title_english,
        is_approved,
        deleted_at,
        created_at,
        average_score
      FROM app.manga
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (mangaResult.rows.length === 0) {
      console.log('❌ No hay mangas en la base de datos');
    } else {
      console.log(`✅ Total de mangas encontrados: ${mangaResult.rows.length}`);
      mangaResult.rows.forEach((manga, index) => {
        console.log(`\n  ${index + 1}. ${manga.title_romaji || manga.title_english || 'Sin título'}`);
        console.log(`     ID: ${manga.id}`);
        console.log(`     Aprobado: ${manga.is_approved ? '✅ Sí' : '❌ No'}`);
        console.log(`     Eliminado: ${manga.deleted_at ? '🗑️ Sí' : '✅ No'}`);
        console.log(`     Score: ${manga.average_score || 0}`);
        console.log(`     Creado: ${manga.created_at}`);
      });
    }
    
    // 3. Verificar usuarios
    console.log('\n\n👤 === USUARIOS ===');
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.is_active,
        u.deleted_at,
        json_agg(r.name) as roles
      FROM app.users u
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      console.log(`✅ Total de usuarios encontrados: ${usersResult.rows.length}`);
      usersResult.rows.forEach((user, index) => {
        const roles = user.roles && user.roles[0] !== null ? user.roles.join(', ') : 'sin rol';
        console.log(`\n  ${index + 1}. ${user.username} (${user.email})`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Roles: ${roles}`);
        console.log(`     Activo: ${user.is_active ? '✅ Sí' : '❌ No'}`);
        console.log(`     Eliminado: ${user.deleted_at ? '🗑️ Sí' : '✅ No'}`);
      });
    }
    
    // 4. Verificar slug
    console.log('\n\n🔗 === VERIFICACIÓN DE SLUG ===');
    const slugCheckAnime = await pool.query(`
      SELECT COUNT(*) as total, COUNT(slug) as with_slug
      FROM app.anime
      WHERE is_published = TRUE AND deleted_at IS NULL
    `);
    
    const slugCheckManga = await pool.query(`
      SELECT COUNT(*) as total, COUNT(slug) as with_slug
      FROM app.manga
      WHERE is_approved = TRUE AND deleted_at IS NULL
    `);
    
    console.log(`Anime: ${slugCheckAnime.rows[0].with_slug}/${slugCheckAnime.rows[0].total} tienen slug`);
    console.log(`Manga: ${slugCheckManga.rows[0].with_slug}/${slugCheckManga.rows[0].total} tienen slug`);
    
    console.log('\n✅ Verificación completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
