require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Descripciones de cada tabla
const descriptions = {
  'action_points': 'Define cuántos puntos recibe un usuario por cada tipo de acción (contribuir, reportar, etc). Usado por el sistema de gamificación.',
  'alternative_titles': 'Almacena títulos alternativos de cualquier media (anime, manga, etc) en diferentes idiomas. Relación polimórfica via titleable_type/id.',
  'anime': 'Catálogo principal de anime. Contiene toda la información: títulos, sinopsis, fechas, scores, imágenes, IDs externos (MAL, AniList, Kitsu).',
  'audit_log': 'Registro de auditoría de acciones importantes del sistema. Guarda quién hizo qué, cuándo y con qué datos.',
  'character_voice_actors': 'Relación muchos-a-muchos entre personajes y actores de voz. Un personaje puede tener múltiples seiyuus.',
  'characterable_characters': 'Relación polimórfica entre personajes y media. Permite asociar personajes a anime, manga, etc.',
  'characters': 'Catálogo de personajes. Incluye nombre, descripción, imagen, y datos de APIs externas.',
  'comment_reactions': 'Reacciones (likes/dislikes) a comentarios. Un usuario puede reaccionar una vez por comentario.',
  'comment_reports': 'Reportes de comentarios inapropiados. Los usuarios reportan, moderadores revisan.',
  'comments': 'Sistema de comentarios polimórfico. Soporta comentarios en cualquier tipo de media y respuestas anidadas.',
  'content_contributions': 'Ediciones de contenido existente propuestas por usuarios. Los moderadores aprueban/rechazan. Al aprobar, un trigger aplica los cambios.',
  'content_reports': 'Reportes de contenido erróneo o inapropiado en fichas de media.',
  'donghua': 'Catálogo de donghua (animación china). Estructura similar a anime.',
  'episodes': 'Episodios de anime/donghua. Información por episodio: número, título, fecha de emisión, thumbnail.',
  'external_links': 'Enlaces externos de media (sitios oficiales, streaming, etc). Relación polimórfica.',
  'fan_comics': 'Catálogo de fan comics/doujinshi creados por fans. Media type: fan_comic.',
  'genres': 'Catálogo de géneros (Acción, Romance, Comedia, etc). Cada género tiene nombre, slug e icono.',
  'list_items': 'Items individuales dentro de listas de usuarios. Cada item es una referencia a un media.',
  'lists': 'Listas personalizadas de usuarios (Watchlist, Favoritos, etc). Pueden ser públicas o privadas.',
  'login_attempts': 'Registro de intentos de login fallidos. Usado para rate limiting y seguridad.',
  'manga': 'Catálogo principal de manga japonés. Estructura similar a anime pero con campos específicos (chapters, volumes).',
  'manhua': 'Catálogo de manhua (comics chinos). Similar a manga.',
  'manhwa': 'Catálogo de manhwa (comics coreanos). Similar a manga.',
  'media_genres': 'Relación muchos-a-muchos entre media y géneros. Polimórfica via media_type/media_id.',
  'media_relations': 'Relaciones entre media: secuelas, precuelas, spin-offs, adaptaciones. Polimórfica.',
  'media_statuses': 'Catálogo de estados de media: Emitiendo, Finalizado, Próximamente, Cancelado, etc.',
  'media_trailers': 'Trailers de media (YouTube, etc). Polimórfica. Guarda views y metadata.',
  'notifications': 'Notificaciones para usuarios. Tipos: contribución aprobada/rechazada, nuevo reporte, etc.',
  'novels': 'Catálogo de novelas ligeras (light novels). Estructura similar a manga.',
  'oauth_accounts': 'Cuentas OAuth vinculadas (Google, Discord, etc). Un usuario puede tener múltiples providers.',
  'password_reset_tokens': 'Tokens temporales para resetear contraseña. Expiran después de X tiempo.',
  'permissions': 'Catálogo de permisos del sistema (can_edit, can_delete, can_moderate, etc).',
  'rankings_cache': 'Cache de rankings calculados. Evita recalcular rankings en cada request.',
  'recovery_codes': 'Códigos de recuperación para 2FA. Se usan cuando el usuario pierde acceso al authenticator.',
  'review_reports': 'Reportes de reseñas inapropiadas. Similar a comment_reports.',
  'review_votes': 'Votos de utilidad en reseñas (útil/no útil).',
  'reviews': 'Reseñas de media escritas por usuarios. Incluyen rating y texto.',
  'role_permissions': 'Relación muchos-a-muchos entre roles y permisos.',
  'roles': 'Catálogo de roles: user, moderator, admin, super_admin.',
  'staff': 'Catálogo de staff de la industria: directores, escritores, productores, etc.',
  'staffable_staff': 'Relación polimórfica entre staff y media. Define el rol del staff en cada obra.',
  'studiable_studios': 'Relación polimórfica entre estudios y media.',
  'studios': 'Catálogo de estudios de animación (MAPPA, Ufotable, etc).',
  'taggable_tags': 'Relación polimórfica entre tags y media.',
  'tags': 'Catálogo de tags/etiquetas descriptivas (Gore, Isekai, Time Travel, etc).',
  'trailer_views': 'Registro de vistas de trailers. Para analytics.',
  'user_2fa': 'Configuración de autenticación de dos factores por usuario.',
  'user_contributions': 'Propuestas de NUEVO contenido por usuarios (agregar anime/manga que no existe).',
  'user_favorites': 'Favoritos de usuarios. Polimórfica - puede ser cualquier tipo de media.',
  'user_follows': 'Sistema de seguimiento entre usuarios.',
  'user_reports': 'Reportes de usuarios problemáticos.',
  'user_roles': 'Relación usuarios-roles. Un usuario puede tener múltiples roles.',
  'users': 'Tabla principal de usuarios. Contiene auth, perfil, configuración y estadísticas.',
  'voice_actors': 'Catálogo de actores de voz/seiyuus.',
  'v_moderator_report_stats': '(VISTA) Estadísticas de reportes para moderadores.',
  'v_user_contribution_stats': '(VISTA) Estadísticas de contribuciones por usuario.',
  'v_user_public_profile': '(VISTA) Perfil público de usuario (sin datos sensibles).'
};

async function getTableColumns(tableName) {
  const { rows } = await pool.query(`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'app' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return rows;
}

async function getTableConstraints(tableName) {
  const { rows } = await pool.query(`
    SELECT 
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'app' 
      AND tc.table_name = $1
      AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    ORDER BY tc.constraint_type, kcu.column_name
  `, [tableName]);
  return rows;
}

async function getSampleData(tableName) {
  try {
    const { rows } = await pool.query(`SELECT * FROM app."${tableName}" LIMIT 2`);
    return rows;
  } catch (e) {
    return null;
  }
}

async function run() {
  // Obtener todas las tablas
  const { rows: tables } = await pool.query(`
    SELECT table_name, table_type
    FROM information_schema.tables 
    WHERE table_schema = 'app' 
    ORDER BY table_name
  `);

  let md = `# 🗄️ Base de Datos - Documentación Completa

Documentación detallada del schema \`app\` en PostgreSQL.

**Total:** ${tables.length} tablas/vistas

---

## 📋 Índice Rápido

| # | Tabla | Tipo | Descripción |
|:-:|-------|:----:|-------------|
`;

  // Índice
  tables.forEach((t, i) => {
    const desc = descriptions[t.table_name] || '';
    const shortDesc = desc.length > 60 ? desc.substring(0, 57) + '...' : desc;
    const type = t.table_type === 'VIEW' ? '👁️ Vista' : '📋 Tabla';
    md += `| ${i + 1} | [\`${t.table_name}\`](#${t.table_name.replace(/_/g, '_')}) | ${type} | ${shortDesc} |\n`;
  });

  md += `\n---\n\n# 📊 Detalle de Tablas\n\n`;

  // Procesar cada tabla
  for (const table of tables) {
    const tableName = table.table_name;
    console.log(`Procesando: ${tableName}...`);

    const columns = await getTableColumns(tableName);
    const constraints = await getTableConstraints(tableName);
    
    // Identificar PKs y FKs
    const pks = constraints.filter(c => c.constraint_type === 'PRIMARY KEY').map(c => c.column_name);
    const fks = constraints.filter(c => c.constraint_type === 'FOREIGN KEY').map(c => c.column_name);
    const uniques = constraints.filter(c => c.constraint_type === 'UNIQUE').map(c => c.column_name);

    md += `## \`${tableName}\`\n\n`;
    
    if (descriptions[tableName]) {
      md += `> ${descriptions[tableName]}\n\n`;
    }

    md += `| Columna | Tipo | Null | Key | Default |\n`;
    md += `|---------|------|:----:|:---:|----------|\n`;

    for (const col of columns) {
      let type = col.data_type;
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`;
      }
      
      const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
      
      let key = '';
      if (pks.includes(col.column_name)) key = '🔑 PK';
      else if (fks.includes(col.column_name)) key = '🔗 FK';
      else if (uniques.includes(col.column_name)) key = '🔒 UQ';
      
      let defVal = col.column_default || '-';
      if (defVal.length > 25) defVal = defVal.substring(0, 22) + '...';
      
      md += `| \`${col.column_name}\` | ${type} | ${nullable} | ${key} | ${defVal} |\n`;
    }

    md += `\n---\n\n`;
  }

  // Leyenda
  md += `## 📖 Leyenda

| Símbolo | Significado |
|:-------:|-------------|
| 🔑 PK | Primary Key - Identificador único |
| 🔗 FK | Foreign Key - Referencia a otra tabla |
| 🔒 UQ | Unique - Valor único en la tabla |
| ✅ | Permite NULL |
| ❌ | NOT NULL - Requerido |
| 👁️ | Vista (VIEW) |
| 📋 | Tabla |

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
`;

  fs.writeFileSync('docs/database/TABLES.md', md);
  console.log('\n✅ docs/database/TABLES.md generado!');
  
  await pool.end();
}

run().catch(console.error);
