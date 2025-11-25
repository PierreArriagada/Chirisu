/**
 * ============================================================================
 * UTILIDAD: Extracción automática de colores durante importación
 * ============================================================================
 * 
 * Este módulo proporciona funciones para extraer automáticamente el color
 * dominante durante la importación de medios, cuando AniList no provee el color.
 * 
 * Características:
 * - Extrae color solo si no viene de AniList
 * - Maneja errores sin interrumpir la importación
 * - Registra intentos fallidos para revisión posterior
 * 
 * ============================================================================
 */

import { extractDominantColorHex } from '../../../src/lib/color-extractor';

/**
 * Extrae el color dominante de una imagen durante la importación.
 * 
 * @param imageUrl - URL de la imagen de portada
 * @param anilistColor - Color provisto por AniList (opcional)
 * @param mediaTitle - Título del medio (para logging)
 * @returns Color en formato hex (#RRGGBB) o null si falla
 */
export async function extractColorDuringImport(
  imageUrl: string | null,
  anilistColor: string | null,
  mediaTitle: string
): Promise<string | null> {
  // Si AniList ya provee el color, usarlo directamente
  if (anilistColor) {
    console.log(`   ✅ Color de AniList: ${anilistColor}`);
    return anilistColor;
  }

  // Si no hay imagen, no se puede extraer
  if (!imageUrl) {
    console.log(`   ⚠️  Sin imagen para "${mediaTitle}", omitiendo extracción de color`);
    return null;
  }

  try {
    console.log(`   🎨 Extrayendo color dominante para "${mediaTitle}"...`);
    const color = await extractDominantColorHex(imageUrl);
    
    if (color) {
      console.log(`   ✅ Color extraído: ${color}`);
      return color;
    } else {
      console.log(`   ⚠️  No se pudo extraer color para "${mediaTitle}"`);
      return null;
    }
  } catch (error) {
    // No interrumpir la importación por un error de color
    console.error(`   ❌ Error extrayendo color para "${mediaTitle}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Extrae color con reintento en caso de fallo.
 * Útil para imágenes que pueden estar temporalmente inaccesibles.
 * 
 * @param imageUrl - URL de la imagen
 * @param anilistColor - Color de AniList (opcional)
 * @param mediaTitle - Título del medio
 * @param maxRetries - Número máximo de reintentos (default: 2)
 * @returns Color hex o null
 */
export async function extractColorWithRetry(
  imageUrl: string | null,
  anilistColor: string | null,
  mediaTitle: string,
  maxRetries: number = 2
): Promise<string | null> {
  // Si AniList provee color, usarlo sin intentar extraer
  if (anilistColor) {
    return anilistColor;
  }

  // Si no hay imagen, retornar null
  if (!imageUrl) {
    return null;
  }

  // Intentar extracción con reintentos
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const color = await extractDominantColorHex(imageUrl);
      if (color) {
        console.log(`   ✅ Color extraído en intento ${attempt}/${maxRetries}: ${color}`);
        return color;
      }
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`   ❌ Fallo tras ${maxRetries} intentos para "${mediaTitle}"`);
        return null;
      }
      console.log(`   ⚠️  Intento ${attempt}/${maxRetries} falló, reintentando...`);
      // Esperar 500ms antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return null;
}

/**
 * Verifica si la URL de imagen cambió y necesita re-calcular color.
 * 
 * @param currentUrl - URL actual en la base de datos
 * @param newUrl - Nueva URL de la imagen
 * @returns true si la imagen cambió y necesita recalcular color
 */
export function needsColorRecalculation(
  currentUrl: string | null,
  newUrl: string | null
): boolean {
  // Si no hay URL nueva, no recalcular
  if (!newUrl) return false;
  
  // Si no había URL antes, es nueva, calcular
  if (!currentUrl) return true;
  
  // Si las URLs son diferentes, recalcular
  return currentUrl !== newUrl;
}
