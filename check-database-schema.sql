-- ============================================
-- SCRIPT PARA VERIFICAR ESTRUCTURA ACTUAL
-- ============================================

SET search_path = app, public;

-- Ver columnas de characters
SELECT 'CHARACTERS TABLE' as table_name;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'characters'
ORDER BY ordinal_position;

-- Ver columnas de staff
SELECT 'STAFF TABLE' as table_name;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'staff'
ORDER BY ordinal_position;

-- Ver columnas de voice_actors
SELECT 'VOICE_ACTORS TABLE' as table_name;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'voice_actors'
ORDER BY ordinal_position;

-- Ver columnas de character_voice_actors
SELECT 'CHARACTER_VOICE_ACTORS TABLE' as table_name;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'character_voice_actors'
ORDER BY ordinal_position;

-- Ver todas las tablas en el schema app
SELECT 'ALL TABLES IN APP SCHEMA' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
ORDER BY table_name;
