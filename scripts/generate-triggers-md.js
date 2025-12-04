require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Descripciones de triggers
const triggerDescriptions = {
  'trg_anime_update_popularity': 'Recalcula popularidad del anime cuando cambian favoritos/listas',
  'trg_anime_update_ranking': 'Actualiza ranking_score basado en average_score y ratings_count',
  'trg_set_anime_slug': 'Genera slug automático desde el título (ej: "Attack on Titan" → "attack-on-titan")',
  'trg_comment_reaction_delete': 'Resta likes/dislikes al eliminar reacción',
  'trg_comment_reaction_insert': 'Suma likes/dislikes al crear reacción',
  'trg_notify_new_comment_report': 'Notifica a moderadores cuando se reporta un comentario',
  'trg_comment_delete_update_replies': 'Actualiza contador de respuestas al eliminar comentario',
  'trg_comment_insert_update_replies': 'Actualiza contador de respuestas al crear comentario',
  'trg_comments_update_time': 'Actualiza updated_at automáticamente',
  'trg_insert_comment': 'Trigger post-insert para comentarios',
  'trg_apply_approved_contribution': 'CRÍTICO: Aplica cambios a la tabla destino cuando se aprueba una contribución',
  'trg_notify_contributor_review': 'Notifica al usuario cuando su contribución es revisada',
  'trg_notify_moderators_new_contribution': 'Notifica a moderadores sobre nuevas contribuciones pendientes',
  'trg_update_contribution_timestamp': 'Actualiza timestamp al modificar contribución',
  'trg_content_reports_update_timestamp': 'Actualiza timestamp de reportes de contenido',
  'trg_notify_moderators_new_report': 'Notifica a mods sobre nuevos reportes',
  'trg_notify_new_report': 'Notifica sobre nuevos reportes',
  'trg_notify_reporter_resolution': 'Notifica al reportante cuando se resuelve su reporte',
  'trg_donghua_update_popularity': 'Similar a anime - actualiza popularidad',
  'trg_donghua_update_ranking': 'Similar a anime - actualiza ranking',
  'trg_set_donghua_slug': 'Genera slug para donghua',
  'trg_donghua_update_time': 'Actualiza updated_at',
  'trg_set_donghua_status_default': 'Establece status por defecto al crear',
  'trg_episodes_update_time': 'Actualiza updated_at de episodios',
  'trg_fan_comics_update_popularity': 'Actualiza popularidad de fan comics',
  'trg_fan_comics_update_ranking': 'Actualiza ranking de fan comics',
  'trg_set_fan_comics_slug': 'Genera slug para fan comics',
  'trg_set_fan_comics_status_default': 'Status por defecto para fan comics',
  'trg_list_items_delete': 'Actualiza item_count al eliminar de lista',
  'trg_list_items_insert': 'Actualiza item_count al agregar a lista',
  'trg_lists_update_time': 'Actualiza updated_at de listas',
  'trg_manga_update_popularity': 'Actualiza popularidad de manga',
  'trg_manga_update_ranking': 'Actualiza ranking de manga',
  'trg_set_manga_slug': 'Genera slug para manga',
  'trg_manhua_update_popularity': 'Actualiza popularidad de manhua',
  'trg_manhua_update_ranking': 'Actualiza ranking de manhua',
  'trg_set_manhua_slug': 'Genera slug para manhua',
  'trg_manhwa_update_popularity': 'Actualiza popularidad de manhwa',
  'trg_manhwa_update_ranking': 'Actualiza ranking de manhwa',
  'trg_set_manhwa_slug': 'Genera slug para manhwa',
  'trg_novels_update_popularity': 'Actualiza popularidad de novelas',
  'trg_novels_update_ranking': 'Actualiza ranking de novelas',
  'trg_set_novels_slug': 'Genera slug para novelas',
  'trg_review_stats': 'Actualiza average_score del media al crear/modificar reseña',
  'trg_notify_new_review_report': 'Notifica sobre reportes de reseñas',
  'trg_user_contribution_notify': 'Notifica sobre nuevas contribuciones de usuarios',
  'trg_user_favorites_delete': 'Actualiza contador de favoritos al eliminar',
  'trg_user_favorites_insert': 'Actualiza contador de favoritos al agregar'
};

// Descripciones de funciones
const functionDescriptions = {
  'fn_apply_approved_contribution': 'CRÍTICO: Ejecuta UPDATE dinámico para aplicar cambios aprobados a la tabla destino',
  'fn_notify_moderators_new_contribution': 'Crea notificaciones para moderadores cuando hay nueva contribución',
  'fn_notify_contributor_review': 'Notifica al contribuyente el resultado de su contribución',
  'fn_award_points': 'Suma puntos al usuario según tipo de acción realizada',
  'fn_update_media_review_stats': 'Recalcula average_score y ratings_count de un media',
  'fn_update_media_ranking': 'Calcula ranking_score para ordenamiento',
  'fn_update_media_popularity': 'Calcula popularidad basada en favoritos y listas',
  'fn_recalculate_all_rankings': 'Recalcula rankings de todas las tablas de media',
  'generate_slug': 'Convierte texto a slug URL-friendly',
  'fn_update_updated_at': 'Función genérica para actualizar campo updated_at',
  'fn_update_comment_likes': 'Actualiza contadores de likes/dislikes en comentarios',
  'fn_update_comment_replies': 'Actualiza contador de respuestas en comentarios',
  'fn_update_list_item_count': 'Actualiza contador de items en listas'
};

async function run() {
  // Obtener triggers
  const { rows: triggers } = await pool.query(`
    SELECT 
      trigger_name,
      event_manipulation,
      event_object_table,
      action_timing,
      action_statement
    FROM information_schema.triggers 
    WHERE trigger_schema = 'app'
    ORDER BY event_object_table, trigger_name
  `);

  // Obtener funciones
  const { rows: functions } = await pool.query(`
    SELECT 
      p.proname as name,
      pg_get_function_arguments(p.oid) as args,
      pg_get_function_result(p.oid) as returns,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'app'
    ORDER BY p.proname
  `);

  let md = `# ⚡ Base de Datos - Triggers y Funciones

Documentación de la lógica de negocio implementada en PostgreSQL.

**Total triggers:** ${triggers.length}  
**Total funciones:** ${functions.length}

---

## 📋 Índice

1. [Triggers por Tabla](#-triggers-por-tabla)
2. [Funciones Principales](#-funciones-principales)
3. [Detalle de Funciones Críticas](#-detalle-de-funciones-críticas)

---

# 🔔 Triggers por Tabla

`;

  // Agrupar triggers por tabla
  const triggersByTable = {};
  triggers.forEach(t => {
    if (!triggersByTable[t.event_object_table]) {
      triggersByTable[t.event_object_table] = [];
    }
    triggersByTable[t.event_object_table].push(t);
  });

  for (const [table, tableTriggers] of Object.entries(triggersByTable).sort()) {
    md += `## \`${table}\`\n\n`;
    md += `| Trigger | Evento | Timing | Función | Descripción |\n`;
    md += `|---------|--------|--------|---------|-------------|\n`;

    // Deduplicate (mismo trigger puede aparecer para INSERT y UPDATE)
    const seen = new Set();
    for (const t of tableTriggers) {
      const key = `${t.trigger_name}-${t.event_manipulation}`;
      if (!seen.has(key)) {
        seen.add(key);
        const funcName = t.action_statement.replace('EXECUTE FUNCTION app.', '').replace('()', '');
        const desc = triggerDescriptions[t.trigger_name] || '';
        md += `| \`${t.trigger_name}\` | ${t.event_manipulation} | ${t.action_timing} | \`${funcName}\` | ${desc} |\n`;
      }
    }
    md += '\n';
  }

  md += `---\n\n# 🔧 Funciones Principales\n\n`;
  md += `| Función | Argumentos | Retorna | Descripción |\n`;
  md += `|---------|------------|---------|-------------|\n`;

  for (const f of functions) {
    let args = f.args || '-';
    if (args.length > 30) args = args.substring(0, 27) + '...';
    let returns = f.returns || '-';
    const desc = functionDescriptions[f.name] || '';
    md += `| \`${f.name}\` | ${args} | ${returns} | ${desc} |\n`;
  }

  md += `\n---\n\n# 📝 Detalle de Funciones Críticas\n\n`;

  // Funciones críticas a detallar
  const criticalFunctions = [
    'fn_apply_approved_contribution',
    'fn_notify_moderators_new_contribution',
    'fn_notify_contributor_review',
    'fn_award_points',
    'fn_update_media_review_stats',
    'fn_update_media_ranking',
    'generate_slug'
  ];

  for (const funcName of criticalFunctions) {
    const func = functions.find(f => f.name === funcName);
    if (func) {
      md += `## \`${func.name}\`\n\n`;
      if (functionDescriptions[func.name]) {
        md += `> ${functionDescriptions[func.name]}\n\n`;
      }
      md += `**Argumentos:** \`${func.args || 'ninguno'}\`  \n`;
      md += `**Retorna:** \`${func.returns}\`\n\n`;
      md += `\`\`\`sql\n${func.definition.substring(0, 2000)}${func.definition.length > 2000 ? '\n-- ... (código truncado)' : ''}\n\`\`\`\n\n---\n\n`;
    }
  }

  md += `## 📖 Resumen de Flujos

### Flujo de Contribuciones
1. Usuario envía edición → \`INSERT content_contributions\`
2. \`trg_notify_moderators_new_contribution\` → Notifica a moderadores
3. Moderador revisa y aprueba → \`UPDATE status = 'approved'\`
4. \`trg_apply_approved_contribution\` → Ejecuta \`fn_apply_approved_contribution\`
5. Función aplica UPDATE dinámico a tabla destino (anime, manga, etc)
6. \`trg_notify_contributor_review\` → Notifica al usuario

### Flujo de Rankings
1. Se modifica average_score o ratings_count
2. \`trg_*_update_ranking\` → Ejecuta \`fn_update_media_ranking\`
3. Calcula \`ranking_score = average_score * LOG(ratings_count + 1)\`

### Flujo de Slugs
1. Se inserta nuevo media o se actualiza título
2. \`trg_set_*_slug\` → Ejecuta \`generate_slug\`
3. Convierte título a URL-friendly (lowercase, guiones, sin caracteres especiales)

---

**Generado automáticamente desde la base de datos**  
**Última actualización:** ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
`;

  fs.writeFileSync('docs/database/TRIGGERS.md', md);
  console.log('✅ docs/database/TRIGGERS.md generado!');

  await pool.end();
}

run().catch(console.error);
