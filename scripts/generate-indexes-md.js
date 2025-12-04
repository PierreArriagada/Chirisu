require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function run() {
  // Obtener índices
  const { rows: indexes } = await pool.query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'app'
    ORDER BY tablename, indexname
  `);

  // Agrupar por tabla
  const indexesByTable = {};
  indexes.forEach(idx => {
    if (!indexesByTable[idx.tablename]) {
      indexesByTable[idx.tablename] = [];
    }
    indexesByTable[idx.tablename].push(idx);
  });

  // Estadísticas
  const stats = {
    total: indexes.length,
    pk: indexes.filter(i => i.indexname.includes('pkey')).length,
    unique: indexes.filter(i => i.indexdef.includes('UNIQUE') && !i.indexname.includes('pkey')).length,
    gin: indexes.filter(i => i.indexdef.toLowerCase().includes('gin')).length,
    btree: indexes.filter(i => i.indexdef.includes('btree')).length
  };

  let md = `# 📇 Base de Datos - Índices

Documentación de índices para optimización de consultas.

---

## 📊 Estadísticas Generales

| Métrica | Cantidad |
|---------|:--------:|
| **Total índices** | ${stats.total} |
| Primary Keys (🔑) | ${stats.pk} |
| Unique (🔒) | ${stats.unique} |
| GIN - Full Text (🔍) | ${stats.gin} |
| B-Tree (🌳) | ${stats.btree - stats.pk - stats.unique} |

---

## 📋 Resumen por Tabla

| Tabla | Total | PK | Unique | GIN | B-Tree |
|-------|:-----:|:--:|:------:|:---:|:------:|
`;

  // Resumen por tabla
  for (const [table, tableIndexes] of Object.entries(indexesByTable).sort()) {
    const pk = tableIndexes.filter(i => i.indexname.includes('pkey')).length;
    const unique = tableIndexes.filter(i => i.indexdef.includes('UNIQUE') && !i.indexname.includes('pkey')).length;
    const gin = tableIndexes.filter(i => i.indexdef.toLowerCase().includes('gin')).length;
    const btree = tableIndexes.length - pk - unique - gin;
    md += `| \`${table}\` | ${tableIndexes.length} | ${pk} | ${unique} | ${gin} | ${btree} |\n`;
  }

  md += `\n---\n\n# 📋 Detalle por Tabla\n\n`;

  // Detalle por tabla
  for (const [table, tableIndexes] of Object.entries(indexesByTable).sort()) {
    md += `## \`${table}\`\n\n`;
    md += `| Índice | Tipo | Columnas | Propósito |\n`;
    md += `|--------|:----:|----------|----------|\n`;

    for (const idx of tableIndexes) {
      // Determinar tipo
      let type = '📇';
      let purpose = 'Búsqueda';
      if (idx.indexname.includes('pkey')) {
        type = '🔑 PK';
        purpose = 'Identificador único';
      } else if (idx.indexdef.includes('UNIQUE')) {
        type = '🔒 UQ';
        purpose = 'Garantiza unicidad';
      } else if (idx.indexdef.toLowerCase().includes('gin')) {
        type = '🔍 GIN';
        purpose = 'Full-text search';
      } else if (idx.indexdef.includes('btree')) {
        type = '🌳 BT';
      }

      // Extraer columnas
      const match = idx.indexdef.match(/\(([^)]+)\)/);
      let cols = match ? match[1] : '-';
      
      // Detectar propósito específico
      if (cols.includes('DESC')) purpose = 'Ordenamiento descendente';
      if (idx.indexname.includes('polymorphic')) purpose = 'Consultas polimórficas';
      if (idx.indexname.includes('search')) purpose = 'Búsqueda de texto';
      if (cols.includes('created_at') || cols.includes('updated_at')) purpose = 'Filtro por fecha';
      if (cols.includes('status')) purpose = 'Filtro por estado';
      if (cols.includes('user_id')) purpose = 'Consultas por usuario';
      if (cols.includes('slug')) purpose = 'Búsqueda por URL';
      
      if (cols.length > 50) cols = cols.substring(0, 47) + '...';

      md += `| \`${idx.indexname}\` | ${type} | ${cols} | ${purpose} |\n`;
    }
    md += '\n';
  }

  md += `---\n\n## 📖 Guía de Tipos de Índices

| Tipo | Símbolo | Descripción | Cuándo usar |
|------|:-------:|-------------|-------------|
| **Primary Key** | 🔑 | Identificador único de fila | Automático en columna \`id\` |
| **Unique** | 🔒 | Garantiza valores únicos | Emails, usernames, slugs |
| **B-Tree** | 🌳 | Árbol balanceado | Comparaciones: =, <, >, BETWEEN |
| **GIN** | 🔍 | Generalized Inverted Index | Full-text search, arrays, JSONB |

## 🎯 Patrones de Índices en Chirisu

### Índices de Performance
- \`idx_{tabla}_popularity\` - Ordenar por popularidad DESC
- \`idx_{tabla}_ranking_score\` - Ordenar por ranking
- \`idx_{tabla}_created_at\` - Filtrar contenido reciente

### Índices de Unicidad
- \`{tabla}_slug_key\` - URLs únicas
- \`{tabla}_mal_id_key\` - IDs de MyAnimeList únicos
- \`{tabla}_anilist_id_key\` - IDs de AniList únicos

### Índices Polimórficos
- \`idx_{tabla}_polymorphic\` - Combina (media_type, media_id) para consultas eficientes

### Índices de Búsqueda
- \`idx_{tabla}_title_search\` - GIN para búsqueda full-text en títulos

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
`;

  fs.writeFileSync('docs/database/INDEXES.md', md);
  console.log('✅ docs/database/INDEXES.md generado!');

  await pool.end();
}

run().catch(console.error);
