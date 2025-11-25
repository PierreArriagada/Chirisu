/**
 * ============================================================================
 * SERVICIO: Extracción de color dominante de imágenes externas
 * ============================================================================
 * 
 * Este servicio extrae el color dominante de imágenes desde URLs externas
 * (AniList, MyAnimeList, etc.) usando Node.js en el backend.
 * 
 * Ventajas:
 * - Sin problemas de CORS (se ejecuta en servidor)
 * - Soporte para URLs externas
 * - Caché de colores en base de datos
 * - Detección automática de cambios de imagen
 * 
 * ============================================================================
 */

import sharp from 'sharp';
import fetch from 'node-fetch';

export type RGBColor = [number, number, number];

/**
 * Cuantiza un color RGB a buckets para agrupar colores similares
 */
function quantizeColor(r: number, g: number, b: number, bucketSize = 32): string {
  const qr = Math.floor(r / bucketSize) * bucketSize;
  const qg = Math.floor(g / bucketSize) * bucketSize;
  const qb = Math.floor(b / bucketSize) * bucketSize;
  return `${qr},${qg},${qb}`;
}

/**
 * Calcula luminancia de un color (para filtrar colores muy claros/oscuros)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula la saturación de un color
 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  
  if (max === 0) return 0;
  return delta / max;
}

/**
 * Extrae el color dominante de una imagen usando análisis de histograma
 * 
 * @param imageUrl - URL de la imagen (puede ser externa)
 * @returns Color RGB dominante en formato [r, g, b]
 */
export async function extractDominantColor(imageUrl: string): Promise<RGBColor | null> {
  try {
    console.log(`🎨 Extrayendo color dominante de: ${imageUrl}`);
    
    // 1. Descargar imagen desde URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // 2. Procesar imagen con Sharp (redimensionar para velocidad)
    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();
    
    // Redimensionar a 150px de ancho (mantiene aspecto, mejora velocidad)
    const resized = await image
      .resize(150, null, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = resized;
    const { width, height, channels } = info;
    
    console.log(`   📐 Imagen original: ${metadata.width}x${metadata.height}`);
    console.log(`   📐 Imagen procesada: ${width}x${height} (${channels} canales)`);
    
    // 3. Construir histograma de colores con sistema de puntuación mejorado
    const colorCounts = new Map<string, { count: number; r: number; g: number; b: number; score: number }>();
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = channels === 4 ? data[i + 3] : 255;
      
      // Ignorar píxeles transparentes
      if (alpha < 128) continue;
      
      const luminance = getLuminance(r, g, b);
      const saturation = getSaturation(r, g, b);
      
      // Cuantizar color (buckets más pequeños = más precisión)
      const key = quantizeColor(r, g, b, 16);
      
      if (!colorCounts.has(key)) {
        const [qr, qg, qb] = key.split(',').map(Number);
        colorCounts.set(key, { count: 0, r: qr, g: qg, b: qb, score: 0 });
      }
      
      colorCounts.get(key)!.count++;
    }
    
    // 4. Calcular puntuación para cada color (priorizar colores vibrantes)
    for (const [key, data] of colorCounts.entries()) {
      const { r, g, b, count } = data;
      const luminance = getLuminance(r, g, b);
      const saturation = getSaturation(r, g, b);
      
      let score = count; // Base: frecuencia
      
      // BONUS: Saturación alta (colores vibrantes)
      if (saturation > 0.5) score += count * 2;      // +200% si muy saturado
      else if (saturation > 0.3) score += count;     // +100% si saturado
      
      // BONUS: Luminosidad media (ni muy claro ni muy oscuro)
      if (luminance > 0.3 && luminance < 0.7) {
        score += count * 0.5; // +50% si luminosidad media
      }
      
      // BONUS: Colores puros (rojo, azul, verde, amarillo, etc.)
      const isPureColor = (
        (r > 200 && g < 100 && b < 100) ||  // Rojo
        (g > 200 && r < 100 && b < 100) ||  // Verde
        (b > 200 && r < 100 && g < 100) ||  // Azul
        (r > 200 && g > 200 && b < 100) ||  // Amarillo
        (r > 200 && b > 200 && g < 100) ||  // Magenta
        (g > 200 && b > 200 && r < 100)     // Cyan
      );
      
      if (isPureColor) score += count * 0.3; // +30% si es color puro
      
      // PENALIZACIÓN: Colores grises
      if (saturation < 0.2) {
        score = score * 0.3; // -70% si es gris
      }
      
      // Permitir blanco y negro si son muy dominantes
      if (luminance > 0.95 || luminance < 0.05) {
        if (count > (width * height * 0.3)) { // Si es más del 30% de la imagen
          score = count * 0.5; // Darle puntuación moderada
        } else {
          score = score * 0.1; // Penalizar si no es muy dominante
        }
      }
      
      data.score = score;
    }
    
    // 5. Encontrar color con mejor puntuación
    if (colorCounts.size === 0) {
      console.warn('   ⚠️  No se encontraron colores válidos');
      return null;
    }
    
    let maxScore = 0;
    let dominantColor: RGBColor = [0, 0, 0];
    let maxCount = 0;
    
    for (const [key, { score, r, g, b, count }] of colorCounts.entries()) {
      if (score > maxScore) {
        maxScore = score;
        dominantColor = [r, g, b];
        maxCount = count;
      }
    }
    
    const totalPixels = (width * height);
    const percentage = ((maxCount / totalPixels) * 100).toFixed(1);
    
    console.log(`   ✅ Color dominante: RGB(${dominantColor.join(', ')}) - ${percentage}% de la imagen`);
    
    return dominantColor;
    
  } catch (error) {
    console.error(`   ❌ Error extrayendo color de ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Convierte RGB a formato hexadecimal
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Extrae color y devuelve en formato hexadecimal
 */
export async function extractDominantColorHex(imageUrl: string): Promise<string | null> {
  const rgb = await extractDominantColor(imageUrl);
  if (!rgb) return null;
  return rgbToHex(...rgb);
}
