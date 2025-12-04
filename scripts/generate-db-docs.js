const fs = require('fs');

// Load data
const tables = JSON.parse(fs.readFileSync('scripts/db-tables.json', 'utf8'));
const triggers = JSON.parse(fs.readFileSync('scripts/db-triggers.json', 'utf8'));
const indexes = JSON.parse(fs.readFileSync('scripts/db-indexes.json', 'utf8'));
const functions = JSON.parse(fs.readFileSync('scripts/db-functions.json', 'utf8'));

// Group tables by name
const tablesByName = {};
tables.forEach(row => {
  if (!tablesByName[row.table_name]) {
    tablesByName[row.table_name] = [];
  }
  tablesByName[row.table_name].push(row);
});

// Generate Tables README
function generateTablesReadme() {
  let md = `# 🗄️ Base de Datos - Tablas

Documentación completa de todas las tablas del schema \`app\` en PostgreSQL.

**Total de tablas:** ${Object.keys(tablesByName).length}

---

## 📋 Índice de Tablas

| # | Tabla | Columnas | Descripción |
|---|-------|----------|-------------|
`;

  const tableNames = Object.keys(tablesByName).sort();
  const descriptions = {
    'action_points': 'Puntos por acciones del usuario',
    'alternative_titles': 'Títulos alternativos de media',
    'anime': 'Catálogo de anime',
    'audit_log': 'Log de auditoría de acciones',
    'character_voice_actors': 'Relación personajes-actores de voz',
    'characterable_characters': 'Relación polimórfica personajes-media',
    'characters': 'Catálogo de personajes',
    'comment_reactions': 'Reacciones a comentarios',
    'comment_reports': 'Reportes de comentarios',
    'comments': 'Sistema de comentarios',
    'content_contributions': 'Ediciones de contenido por usuarios',
    'content_reports': 'Reportes de contenido',
    'donghua': 'Catálogo de donghua (animación china)',
    'episodes': 'Episodios de anime/donghua',
    'external_links': 'Enlaces externos de media',
    'fan_comics': 'Catálogo de fan comics',
    'genres': 'Catálogo de géneros',
    'list_items': 'Items en listas de usuario',
    'lists': 'Listas de usuarios',
    'login_attempts': 'Intentos de login (seguridad)',
    'manga': 'Catálogo de manga',
    'manhua': 'Catálogo de manhua (comics chinos)',
    'manhwa': 'Catálogo de manhwa (comics coreanos)',
    'media_genres': 'Relación media-géneros',
    'media_relations': 'Relaciones entre media (secuelas, etc)',
    'media_statuses': 'Estados de media (airing, completed, etc)',
    'media_trailers': 'Trailers de media',
    'notifications': 'Notificaciones de usuarios',
    'novels': 'Catálogo de novelas ligeras',
    'oauth_accounts': 'Cuentas OAuth (Google, etc)',
    'password_reset_tokens': 'Tokens de reset de contraseña',
    'permissions': 'Catálogo de permisos',
    'rankings_cache': 'Cache de rankings',
    'recovery_codes': 'Códigos de recuperación 2FA',
    'review_reports': 'Reportes de reseñas',
    'review_votes': 'Votos en reseñas',
    'reviews': 'Reseñas de media',
    'role_permissions': 'Relación roles-permisos',
    'roles': 'Catálogo de roles',
    'staff': 'Catálogo de staff (directores, etc)',
    'staffable_staff': 'Relación polimórfica staff-media',
    'studiable_studios': 'Relación polimórfica estudios-media',
    'studios': 'Catálogo de estudios',
    'taggable_tags': 'Relación polimórfica tags-media',
    'tags': 'Catálogo de tags',
    'trailer_views': 'Vistas de trailers',
    'user_2fa': 'Configuración 2FA de usuarios',
    'user_contributions': 'Contribuciones de nuevo contenido',
    'user_favorites': 'Favoritos de usuarios',
    'user_follows': 'Seguidores de usuarios',
    'user_reports': 'Reportes de usuarios',
    'user_roles': 'Relación usuarios-roles',
    'users': 'Usuarios del sistema'
  };

  tableNames.forEach((name, i) => {
    const cols = tablesByName[name].length;
    const desc = descriptions[name] || '';
    md += `| ${i + 1} | [\`${name}\`](#${name}) | ${cols} | ${desc} |\n`;
  });

  md += `\n---\n\n## 📊 Detalle de Tablas\n\n`;

  tableNames.forEach(tableName => {
    const columns = tablesByName[tableName];
    md += `### \`${tableName}\`\n\n`;
    if (descriptions[tableName]) {
      md += `> ${descriptions[tableName]}\n\n`;
    }
    md += `| Columna | Tipo | Nullable | Default |\n`;
    md += `|---------|------|:--------:|----------|\n`;
    
    columns.forEach(col => {
      let type = col.data_type;
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`;
      } else if (col.numeric_precision && col.data_type === 'numeric') {
        type += `(${col.numeric_precision},${col.numeric_scale || 0})`;
      }
      
      const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
      let defVal = col.column_default || '-';
      if (defVal.length > 30) {
        defVal = defVal.substring(0, 27) + '...';
      }
      
      md += `| \`${col.column_name}\` | ${type} | ${nullable} | ${defVal} |\n`;
    });
    
    md += `\n---\n\n`;
  });

  md += `\n**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  
  return md;
}

// Generate Triggers README
function generateTriggersReadme() {
  // Group triggers by table
  const triggersByTable = {};
  triggers.forEach(t => {
    if (!triggersByTable[t.event_object_table]) {
      triggersByTable[t.event_object_table] = [];
    }
    triggersByTable[t.event_object_table].push(t);
  });

  let md = `# ⚡ Base de Datos - Triggers y Funciones

Documentación de triggers y funciones del schema \`app\`.

**Total triggers:** ${triggers.length}
**Total funciones:** ${functions.length}

---

## 📋 Índice

- [Triggers por Tabla](#triggers-por-tabla)
- [Funciones](#funciones)

---

## 🔔 Triggers por Tabla

`;

  Object.keys(triggersByTable).sort().forEach(table => {
    const tableTriggers = triggersByTable[table];
    md += `### \`${table}\`\n\n`;
    md += `| Trigger | Evento | Timing | Función |\n`;
    md += `|---------|--------|--------|----------|\n`;
    
    // Deduplicate triggers with same name (multiple events)
    const seen = new Set();
    tableTriggers.forEach(t => {
      const key = `${t.trigger_name}-${t.event_manipulation}`;
      if (!seen.has(key)) {
        seen.add(key);
        const funcName = t.action_statement.replace('EXECUTE FUNCTION app.', '').replace('()', '');
        md += `| \`${t.trigger_name}\` | ${t.event_manipulation} | ${t.action_timing} | \`${funcName}\` |\n`;
      }
    });
    
    md += `\n`;
  });

  md += `---\n\n## 🔧 Funciones\n\n`;
  md += `| Función | Argumentos | Retorna |\n`;
  md += `|---------|------------|----------|\n`;
  
  functions.forEach(f => {
    let args = f.args || '-';
    if (args.length > 40) args = args.substring(0, 37) + '...';
    let returns = f.returns || '-';
    if (returns.length > 30) returns = returns.substring(0, 27) + '...';
    md += `| \`${f.name}\` | ${args} | ${returns} |\n`;
  });

  md += `\n---\n\n## 📝 Detalle de Funciones Importantes\n\n`;

  // Key functions to detail
  const keyFunctions = [
    'fn_apply_approved_contribution',
    'fn_notify_moderators_new_contribution',
    'fn_notify_contributor_review',
    'fn_award_points',
    'fn_update_media_review_stats',
    'fn_update_media_ranking',
    'fn_recalculate_all_rankings',
    'generate_slug'
  ];

  functions.filter(f => keyFunctions.includes(f.name)).forEach(f => {
    md += `### \`${f.name}\`\n\n`;
    md += `**Argumentos:** \`${f.args || 'ninguno'}\`\n\n`;
    md += `**Retorna:** \`${f.returns}\`\n\n`;
    md += `\`\`\`sql\n${f.definition.substring(0, 1500)}${f.definition.length > 1500 ? '\n-- ... (truncado)' : ''}\n\`\`\`\n\n---\n\n`;
  });

  md += `\n**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  
  return md;
}

// Generate Indexes README
function generateIndexesReadme() {
  // Group by table
  const indexesByTable = {};
  indexes.forEach(idx => {
    if (!indexesByTable[idx.tablename]) {
      indexesByTable[idx.tablename] = [];
    }
    indexesByTable[idx.tablename].push(idx);
  });

  let md = `# 📇 Base de Datos - Índices

Documentación de todos los índices del schema \`app\`.

**Total índices:** ${indexes.length}

---

## 📊 Resumen por Tabla

| Tabla | Índices | PKs | Unique | Otros |
|-------|:-------:|:---:|:------:|:-----:|
`;

  Object.keys(indexesByTable).sort().forEach(table => {
    const tableIndexes = indexesByTable[table];
    const pks = tableIndexes.filter(i => i.indexname.includes('pkey')).length;
    const unique = tableIndexes.filter(i => i.indexdef.includes('UNIQUE') && !i.indexname.includes('pkey')).length;
    const others = tableIndexes.length - pks - unique;
    md += `| \`${table}\` | ${tableIndexes.length} | ${pks} | ${unique} | ${others} |\n`;
  });

  md += `\n---\n\n## 📋 Detalle por Tabla\n\n`;

  Object.keys(indexesByTable).sort().forEach(table => {
    const tableIndexes = indexesByTable[table];
    md += `### \`${table}\`\n\n`;
    md += `| Índice | Tipo | Definición |\n`;
    md += `|--------|------|------------|\n`;
    
    tableIndexes.forEach(idx => {
      let type = '📇';
      if (idx.indexname.includes('pkey')) type = '🔑 PK';
      else if (idx.indexdef.includes('UNIQUE')) type = '🔒 UNIQUE';
      else if (idx.indexdef.includes('gin')) type = '🔍 GIN';
      else if (idx.indexdef.includes('btree')) type = '🌳 B-Tree';
      
      // Extract key columns from indexdef
      let def = idx.indexdef;
      const match = def.match(/USING \w+ \(([^)]+)\)/);
      let cols = match ? match[1] : '-';
      if (cols.length > 50) cols = cols.substring(0, 47) + '...';
      
      md += `| \`${idx.indexname}\` | ${type} | ${cols} |\n`;
    });
    
    md += `\n`;
  });

  md += `---\n\n## 🔍 Tipos de Índices\n\n`;
  md += `| Símbolo | Tipo | Uso |\n`;
  md += `|:-------:|------|-----|\n`;
  md += `| 🔑 | Primary Key | Identificador único de fila |\n`;
  md += `| 🔒 | Unique | Garantiza valores únicos |\n`;
  md += `| 🌳 | B-Tree | Búsquedas de rango y ordenamiento |\n`;
  md += `| 🔍 | GIN | Full-text search y arrays |\n`;
  md += `| 📇 | Otro | Índice estándar |\n`;

  md += `\n\n**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  
  return md;
}

// Generate files
fs.writeFileSync('docs/database/TABLES.md', generateTablesReadme());
console.log('✅ docs/database/TABLES.md created');

fs.writeFileSync('docs/database/TRIGGERS.md', generateTriggersReadme());
console.log('✅ docs/database/TRIGGERS.md created');

fs.writeFileSync('docs/database/INDEXES.md', generateIndexesReadme());
console.log('✅ docs/database/INDEXES.md created');
