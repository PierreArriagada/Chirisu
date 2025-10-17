-- ============================================
-- ACTORES DE VOZ - JUJUTSU KAISEN
-- ============================================

-- Primero, agregar actores de voz japoneses
INSERT INTO app.voice_actors (name_romaji, name_native, language, slug) VALUES
-- Personajes principales
('Yuuma Uchida', '内田雄馬', 'ja', 'yuuma-uchida'),           -- Yuji Itadori
('Yuma Uchida', '内田雄馬', 'ja', 'yuma-uchida-alt'),         -- Alt spelling
('Asami Seto', '瀬戸麻沙美', 'ja', 'asami-seto'),              -- Nobara Kugisaki
('Yuichi Nakamura', '中村悠一', 'ja', 'yuichi-nakamura'),     -- Satoru Gojo
('Junichi Suwabe', '諏訪部順一', 'ja', 'junichi-suwabe'),     -- Ryomen Sukuna
('Megumi Ogata', '緒方恵美', 'ja', 'megumi-ogata'),           -- Megumi Fushiguro
-- Personajes secundarios
('Mikako Komatsu', '小松未可子', 'ja', 'mikako-komatsu'),     -- Maki Zenin
('Koki Uchiyama', '内山昂輝', 'ja', 'koki-uchiyama'),         -- Toge Inumaki
('Tomokazu Seki', '関智一', 'ja', 'tomokazu-seki'),           -- Panda
('Kenjiro Tsuda', '津田健次郎', 'ja', 'kenjiro-tsuda'),       -- Kento Nanami
('Takahiro Sakurai', '櫻井孝宏', 'ja', 'takahiro-sakurai');   -- Suguru Geto

-- Actores de voz en español (doblaje latino)
INSERT INTO app.voice_actors (name_romaji, name_native, language, slug) VALUES
('Enrique Cervantes', 'Enrique Cervantes', 'es', 'enrique-cervantes'),   -- Yuji Itadori
('Carla Castañeda', 'Carla Castañeda', 'es', 'carla-castaneda'),         -- Nobara Kugisaki
('José Gilberto Vilchis', 'José Gilberto Vilchis', 'es', 'jose-gilberto-vilchis'), -- Satoru Gojo
('Gerardo Reyero', 'Gerardo Reyero', 'es', 'gerardo-reyero'),            -- Ryomen Sukuna
('Irwin Dayayan', 'Irwin Dayayan', 'es', 'irwin-dayayan'),               -- Megumi Fushiguro
('Kerygma Flores', 'Kerygma Flores', 'es', 'kerygma-flores'),            -- Maki Zenin
('Eduardo Garza', 'Eduardo Garza', 'es', 'eduardo-garza'),               -- Toge Inumaki
('Herman López', 'Herman López', 'es', 'herman-lopez'),                  -- Panda
('Luis Fernando Orozco', 'Luis Fernando Orozco', 'es', 'luis-fernando-orozco'), -- Kento Nanami
('Carlos Segundo', 'Carlos Segundo', 'es', 'carlos-segundo');            -- Suguru Geto

-- Relacionar personajes con actores de voz japoneses para el ANIME (id=3)
INSERT INTO app.character_voice_actors (character_id, voice_actor_id, media_type, media_id) VALUES
-- Yuji Itadori (character_id=1) con Yuuma Uchida (voice_actor_id=1)
(1, 1, 'anime', 3),
-- Megumi Fushiguro (character_id=2) con Megumi Ogata (voice_actor_id=6)
(2, 6, 'anime', 3),
-- Nobara Kugisaki (character_id=3) con Asami Seto (voice_actor_id=3)
(3, 3, 'anime', 3),
-- Satoru Gojo (character_id=4) con Yuichi Nakamura (voice_actor_id=4)
(4, 4, 'anime', 3),
-- Ryomen Sukuna (character_id=5) con Junichi Suwabe (voice_actor_id=5)
(5, 5, 'anime', 3),
-- Maki Zenin (character_id=6) con Mikako Komatsu (voice_actor_id=7)
(6, 7, 'anime', 3),
-- Toge Inumaki (character_id=7) con Koki Uchiyama (voice_actor_id=8)
(7, 8, 'anime', 3),
-- Panda (character_id=8) con Tomokazu Seki (voice_actor_id=9)
(8, 9, 'anime', 3),
-- Kento Nanami (character_id=9) con Kenjiro Tsuda (voice_actor_id=10)
(9, 10, 'anime', 3),
-- Suguru Geto (character_id=10) con Takahiro Sakurai (voice_actor_id=11)
(10, 11, 'anime', 3);

-- Relacionar personajes con actores de voz en español para el ANIME (id=3)
INSERT INTO app.character_voice_actors (character_id, voice_actor_id, media_type, media_id) VALUES
-- Yuji Itadori (character_id=1) con Enrique Cervantes (voice_actor_id=12)
(1, 12, 'anime', 3),
-- Megumi Fushiguro (character_id=2) con Irwin Dayayan (voice_actor_id=16)
(2, 16, 'anime', 3),
-- Nobara Kugisaki (character_id=3) con Carla Castañeda (voice_actor_id=13)
(3, 13, 'anime', 3),
-- Satoru Gojo (character_id=4) con José Gilberto Vilchis (voice_actor_id=14)
(4, 14, 'anime', 3),
-- Ryomen Sukuna (character_id=5) con Gerardo Reyero (voice_actor_id=15)
(5, 15, 'anime', 3),
-- Maki Zenin (character_id=6) con Kerygma Flores (voice_actor_id=17)
(6, 17, 'anime', 3),
-- Toge Inumaki (character_id=7) con Eduardo Garza (voice_actor_id=18)
(7, 18, 'anime', 3),
-- Panda (character_id=8) con Herman López (voice_actor_id=19)
(8, 19, 'anime', 3),
-- Kento Nanami (character_id=9) con Luis Fernando Orozco (voice_actor_id=20)
(9, 20, 'anime', 3),
-- Suguru Geto (character_id=10) con Carlos Segundo (voice_actor_id=21)
(10, 21, 'anime', 3);

-- Verificar resultados
SELECT 'Actores de voz creados:' AS info;
SELECT COUNT(*) as total_voice_actors, language 
FROM app.voice_actors 
GROUP BY language;

SELECT 'Relaciones creadas:' AS info;
SELECT COUNT(*) as total_relations 
FROM app.character_voice_actors 
WHERE media_type = 'anime' AND media_id = 3;

-- Ver ejemplo de personajes con sus actores de voz
SELECT 
  c.name as personaje,
  cc.role as rol,
  va_jp.name_romaji as actor_jp,
  va_es.name_romaji as actor_es
FROM app.characterable_characters cc
JOIN app.characters c ON c.id = cc.character_id
LEFT JOIN app.character_voice_actors cva_jp ON cva_jp.character_id = c.id 
  AND cva_jp.media_type = 'anime' 
  AND cva_jp.media_id = 3
LEFT JOIN app.voice_actors va_jp ON va_jp.id = cva_jp.voice_actor_id AND va_jp.language = 'ja'
LEFT JOIN app.character_voice_actors cva_es ON cva_es.character_id = c.id 
  AND cva_es.media_type = 'anime' 
  AND cva_es.media_id = 3
LEFT JOIN app.voice_actors va_es ON va_es.id = cva_es.voice_actor_id AND va_es.language = 'es'
WHERE cc.characterable_type = 'anime' 
  AND cc.characterable_id = 3
  AND cc.role = 'main'
LIMIT 5;
