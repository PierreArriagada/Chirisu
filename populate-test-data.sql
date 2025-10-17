-- ============================================
-- POBLAR DATOS DE PERSONAJES DE JUJUTSU KAISEN
-- ============================================

SET search_path = app, public;

-- Actualizar personajes con información completa
UPDATE characters SET
  name_romaji = 'Yuji Itadori',
  name_native = '虎杖悠仁',
  description = 'El protagonista de Jujutsu Kaisen. Un estudiante de secundaria con fuerza física sobrehumana que se convierte en el recipiente de Sukuna.',
  gender = 'Male',
  age = '15',
  blood_type = 'A',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b163867-Y0z7WjCLzeI3.jpg'
WHERE name = 'Yuji Itadori';

UPDATE characters SET
  name_romaji = 'Megumi Fushiguro',
  name_native = '伏黒恵',
  description = 'Hechicero de primer año y usuario de la técnica de las Diez Sombras. Es serio y pragmático en combate.',
  gender = 'Male',
  age = '15',
  blood_type = 'O',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-VqFUcxNlwzgG.png'
WHERE name = 'Megumi Fushiguro';

UPDATE characters SET
  name_romaji = 'Nobara Kugisaki',
  name_native = '釘崎野薔薇',
  description = 'Hechicera de primer año que utiliza muñecos vudú y clavos. Es segura de sí misma y desea ser verdadera consigo misma.',
  gender = 'Female',
  age = '16',
  blood_type = 'A',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b166419-nPlhA0BcUP3A.jpg'
WHERE name = 'Nobara Kugisaki';

UPDATE characters SET
  name_romaji = 'Satoru Gojo',
  name_native = '五条悟',
  description = 'El hechicero más poderoso del mundo moderno. Maestro en la Escuela Técnica de Tokyo y poseedor de los Seis Ojos y el Ilimitado.',
  gender = 'Male',
  age = '28',
  blood_type = 'B',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b133701-GKSXJViacxlO.png'
WHERE name = 'Satoru Gojo';

UPDATE characters SET
  name_romaji = 'Ryomen Sukuna',
  name_native = '両面宿儺',
  description = 'El Rey de las Maldiciones. La maldición más poderosa de la historia, actualmente habita en el cuerpo de Yuji Itadori.',
  gender = 'Male',
  age = '1000+',
  blood_type = 'Unknown',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b164479-7lPzChHuIwT0.png'
WHERE name = 'Ryomen Sukuna';

UPDATE characters SET
  name_romaji = 'Maki Zenin',
  name_native = '禪院真希',
  description = 'Hechicera de segundo año sin energía maldita. Compensa con armas malditas y habilidades físicas sobrenaturales.',
  gender = 'Female',
  age = '16',
  blood_type = 'B',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b127692-EcmRgdTPKtqs.png'
WHERE name = 'Maki Zenin';

UPDATE characters SET
  name_romaji = 'Toge Inumaki',
  name_native = '狗巻棘',
  description = 'Hechicero de segundo año que utiliza palabras malditas. Solo habla usando ingredientes de onigiri para evitar maldecir accidentalmente.',
  gender = 'Male',
  age = '17',
  blood_type = 'AB',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b167873-4E6qdMZXoIWi.png'
WHERE name = 'Toge Inumaki';

UPDATE characters SET
  name_romaji = 'Panda',
  name_native = 'パンダ',
  description = 'Un cadáver maldito mutante creado por el director Masamichi Yaga. A pesar de su apariencia, es muy inteligente y tiene tres núcleos.',
  gender = 'Male',
  age = 'Unknown',
  blood_type = 'Unknown',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b127693-pCL7d7mOCFYv.jpg'
WHERE name = 'Panda';

UPDATE characters SET
  name_romaji = 'Kento Nanami',
  name_native = '七海建人',
  description = 'Ex hechicero de grado 1 que dejó Jujutsu para convertirse en asalariado, pero regresó. Es calmado, serio y metódico.',
  gender = 'Male',
  age = '27',
  blood_type = 'A',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b166427-0XGSlqJMbOg3.png'
WHERE name = 'Kento Nanami';

UPDATE characters SET
  name_romaji = 'Aoi Todo',
  name_native = '東堂葵',
  description = 'Hechicero de tercer año de la escuela de Kyoto. Es extremadamente fuerte y le gusta hablar sobre su tipo ideal de mujer.',
  gender = 'Male',
  age = '18',
  blood_type = 'O',
  image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b172307-dLUhwzjf1Y98.png'
WHERE name = 'Aoi Todo';

-- Actualizar staff con información completa
UPDATE staff SET
  name = 'Sunghoo Park',
  bio = 'Director surcoreano conocido por su trabajo en series de acción. Debutó como director con Jujutsu Kaisen.',
  primary_occupations = ARRAY['Director', 'Storyboard Artist'],
  gender = 'Male',
  hometown = 'South Korea'
WHERE name_romaji = 'Sunghoo Park';

UPDATE staff SET
  name = 'Hiroshi Seko',
  bio = 'Guionista y escritor de series conocido por adaptaciones de manga. Ha trabajado en Attack on Titan y Mob Psycho 100.',
  primary_occupations = ARRAY['Script Writer', 'Series Composition'],
  gender = 'Male',
  hometown = 'Japan'
WHERE name_romaji = 'Hiroshi Seko';

UPDATE staff SET
  name = 'Tadashi Hiramatsu',
  bio = 'Diseñador de personajes y animador clave. Ha trabajado en múltiples series de alto perfil.',
  primary_occupations = ARRAY['Character Designer', 'Animation Director'],
  gender = 'Male',
  hometown = 'Japan'
WHERE name_romaji = 'Tadashi Hiramatsu';

UPDATE staff SET
  name = 'Yoshimasa Terui',
  bio = 'Compositor musical freelance conocido por soundtracks de anime y videojuegos.',
  primary_occupations = ARRAY['Music Composer'],
  gender = 'Male',
  hometown = 'Japan'
WHERE name_romaji = 'Yoshimasa Terui';

UPDATE staff SET
  name = 'Hiroaki Imaki',
  bio = 'Compositor musical freelance que ha trabajado en múltiples anime y games.',
  primary_occupations = ARRAY['Music Composer'],
  gender = 'Male',
  hometown = 'Japan'
WHERE name_romaji = 'Hiroaki Imaki';

-- Actualizar actores de voz japoneses
UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1994-08-03'
WHERE name_romaji = 'Junya Enoki' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1991-12-07'
WHERE name_romaji = 'Yuma Uchida' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Female',
  hometown = 'Kanagawa, Japan',
  date_of_birth = '1997-12-04'
WHERE name_romaji = 'Asami Seto' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Hokkaido, Japan',
  date_of_birth = '1981-02-03'
WHERE name_romaji = 'Yuichi Nakamura' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1974-01-30'
WHERE name_romaji = 'Junichi Suwabe' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Female',
  hometown = 'Shizuoka, Japan',
  date_of_birth = '1992-11-16'
WHERE name_romaji = 'Mikako Komatsu' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1992-05-16'
WHERE name_romaji = 'Koki Uchiyama' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1980-10-21'
WHERE name_romaji = 'Tomokazu Seki' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Tokyo, Japan',
  date_of_birth = '1987-08-25'
WHERE name_romaji = 'Kenjiro Tsuda' AND language = 'Japanese';

UPDATE voice_actors SET
  gender = 'Male',
  hometown = 'Osaka, Japan',
  date_of_birth = '1993-03-25'
WHERE name_romaji = 'Subaru Kimura' AND language = 'Japanese';

-- Verificar datos actualizados
SELECT 'CHARACTERS UPDATED:' as info;
SELECT name, name_romaji, gender, age, blood_type, LENGTH(description) as desc_length
FROM characters
WHERE name_romaji IS NOT NULL
ORDER BY id
LIMIT 10;

SELECT 'STAFF UPDATED:' as info;
SELECT name_romaji, ARRAY_LENGTH(primary_occupations, 1) as occupation_count, gender, hometown
FROM staff
WHERE name IS NOT NULL
ORDER BY id
LIMIT 5;

SELECT 'VOICE ACTORS UPDATED:' as info;
SELECT name_romaji, language, gender, hometown, date_of_birth
FROM voice_actors
ORDER BY language, id
LIMIT 10;

SELECT '✅ DATOS POBLADOS EXITOSAMENTE' as status;
