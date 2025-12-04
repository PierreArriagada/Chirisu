-- =====================================================
-- Migración: Actualizar funciones de slug para manhwa, manhua, donghua
-- 
-- Para contenido asiático no-japonés (coreano, chino), 
-- el slug debe generarse preferentemente desde el título en español
-- o inglés, no desde el romaji/título nativo.
-- =====================================================

-- Actualizar función de slug para MANHWA (coreano)
CREATE OR REPLACE FUNCTION app.fn_manhwa_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Para manhwa: preferir español > inglés > romaji > nativo
    NEW.slug := app.generate_slug(
      COALESCE(
        NULLIF(NEW.title_spanish, ''),
        NULLIF(NEW.title_english, ''),
        NULLIF(NEW.title_romaji, ''),
        NULLIF(NEW.title_native, ''),
        'untitled'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Actualizar función de slug para MANHUA (chino)
CREATE OR REPLACE FUNCTION app.fn_manhua_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Para manhua: preferir español > inglés > romaji > nativo
    NEW.slug := app.generate_slug(
      COALESCE(
        NULLIF(NEW.title_spanish, ''),
        NULLIF(NEW.title_english, ''),
        NULLIF(NEW.title_romaji, ''),
        NULLIF(NEW.title_native, ''),
        'untitled'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Actualizar función de slug para DONGHUA (animación china)
CREATE OR REPLACE FUNCTION app.fn_donghua_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Para donghua: preferir español > inglés > romaji > nativo
    NEW.slug := app.generate_slug(
      COALESCE(
        NULLIF(NEW.title_spanish, ''),
        NULLIF(NEW.title_english, ''),
        NULLIF(NEW.title_romaji, ''),
        NULLIF(NEW.title_native, ''),
        'untitled'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Comentarios de documentación
COMMENT ON FUNCTION app.fn_manhwa_set_slug() IS 'Genera slug para manhwa priorizando título español > inglés > romaji';
COMMENT ON FUNCTION app.fn_manhua_set_slug() IS 'Genera slug para manhua priorizando título español > inglés > romaji';
COMMENT ON FUNCTION app.fn_donghua_set_slug() IS 'Genera slug para donghua priorizando título español > inglés > romaji';
