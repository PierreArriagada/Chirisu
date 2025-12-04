const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Get all tables with columns
    const tablesResult = await client.query(`
      SELECT 
        t.table_schema,
        t.table_name,
        c.column_name,
        c.data_type,
        c.column_default,
        c.is_nullable,
        c.character_maximum_length,
        c.numeric_precision
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'app'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `);
    
    console.log('=== TABLES ===');
    console.log(JSON.stringify(tablesResult.rows));
    
    // 2. Get all triggers
    const triggersResult = await client.query(`
      SELECT 
        trigger_schema,
        trigger_name,
        event_manipulation,
        event_object_schema,
        event_object_table,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'app' OR event_object_schema = 'app'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('=== TRIGGERS ===');
    console.log(JSON.stringify(triggersResult.rows));
    
    // 3. Get all indexes
    const indexesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'app'
      ORDER BY tablename, indexname
    `);
    
    console.log('=== INDEXES ===');
    console.log(JSON.stringify(indexesResult.rows));
    
    // 4. Get all functions
    const functionsResult = await client.query(`
      SELECT 
        n.nspname as schema,
        p.proname as name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app'
      ORDER BY p.proname
    `);
    
    console.log('=== FUNCTIONS ===');
    console.log(JSON.stringify(functionsResult.rows));
    
    // 5. Get foreign keys
    const fkResult = await client.query(`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'app'
      ORDER BY tc.table_name
    `);
    
    console.log('=== FOREIGN_KEYS ===');
    console.log(JSON.stringify(fkResult.rows));
    
    // 6. Get primary keys
    const pkResult = await client.query(`
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'app'
      ORDER BY tc.table_name
    `);
    
    console.log('=== PRIMARY_KEYS ===');
    console.log(JSON.stringify(pkResult.rows));
    
    // 7. Get unique constraints
    const uniqueResult = await client.query(`
      SELECT
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'app'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    console.log('=== UNIQUE_CONSTRAINTS ===');
    console.log(JSON.stringify(uniqueResult.rows));
    
    // 8. Get enums
    const enumsResult = await client.query(`
      SELECT 
        n.nspname as schema,
        t.typname as name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'app'
      GROUP BY n.nspname, t.typname
      ORDER BY t.typname
    `);
    
    console.log('=== ENUMS ===');
    console.log(JSON.stringify(enumsResult.rows));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
