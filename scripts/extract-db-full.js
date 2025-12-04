const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    // Get all tables with columns
    const tablesResult = await client.query(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.column_default,
        c.is_nullable,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'app'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `);
    
    fs.writeFileSync('scripts/db-tables.json', JSON.stringify(tablesResult.rows, null, 2));
    console.log('Tables saved to scripts/db-tables.json');
    
    // Get triggers
    const triggersResult = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'app'
      ORDER BY event_object_table, trigger_name
    `);
    
    fs.writeFileSync('scripts/db-triggers.json', JSON.stringify(triggersResult.rows, null, 2));
    console.log('Triggers saved to scripts/db-triggers.json');
    
    // Get indexes
    const indexesResult = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'app'
      ORDER BY tablename, indexname
    `);
    
    fs.writeFileSync('scripts/db-indexes.json', JSON.stringify(indexesResult.rows, null, 2));
    console.log('Indexes saved to scripts/db-indexes.json');
    
    // Get functions
    const functionsResult = await client.query(`
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
    
    fs.writeFileSync('scripts/db-functions.json', JSON.stringify(functionsResult.rows, null, 2));
    console.log('Functions saved to scripts/db-functions.json');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
