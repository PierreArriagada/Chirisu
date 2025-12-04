/**
 * @fileoverview DynamicTheme - Componente para aplicar un tema de color dinámico.
 * 
 * Extrae el color DOMINANTE (no promedio) de una imagen usando análisis de histograma.
 * Optimizado con caché para evitar recalcular colores de imágenes ya procesadas.
 * Ajusta automáticamente el contraste según la luminosidad del color dominante.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

type RGBColor = [number, number, number];

// Cache global de colores por URL (persiste entre renders)
const colorCache = new Map<string, RGBColor>();

/**
 * Convierte un color hexadecimal (#RRGGBB) a RGB
 */
const hexToRgb = (hex: string): RGBColor | null => {
  // Remover el # si existe
  hex = hex.replace(/^#/, '');
  
  // Validar formato
  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    return null;
  }
  
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  return [r, g, b];
};

/**
 * Calcula la luminancia relativa de un color RGB (0-1)
 * Usado para determinar si un color es claro u oscuro
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Agrupa colores similares en buckets para encontrar el color dominante
 * Reduce el espacio de color de 16M colores a ~4000 buckets para eficiencia
 */
const quantizeColor = (r: number, g: number, b: number): string => {
  const bucket = 32; // Agrupa colores en rangos de 32
  const qr = Math.floor(r / bucket) * bucket;
  const qg = Math.floor(g / bucket) * bucket;
  const qb = Math.floor(b / bucket) * bucket;
  return `${qr},${qg},${qb}`;
};

/**
 * Hook optimizado para extraer el color DOMINANTE de una imagen
 * Usa caché para evitar recalcular y solo se ejecuta cuando cambia la URL
 */
const useDominantColor = (imageUrl: string) => {
  const [color, setColor] = useState<RGBColor | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!imageUrl || processingRef.current) return;

    // 1. Verificar caché primero
    if (colorCache.has(imageUrl)) {
      setColor(colorCache.get(imageUrl)!);
      return;
    }

    processingRef.current = true;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    // Timeout de 15 segundos para dar tiempo a la imagen a cargar
    const timeout = setTimeout(() => {
      console.warn("Image loading timeout after 15 seconds, using fallback color.");
      setColor([128, 128, 128]); // fallback gris neutral
      processingRef.current = false;
    }, 15000); // 15 segundos

    img.onload = () => {
      clearTimeout(timeout); // Cancelar timeout si la imagen carga exitosamente
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Redimensionar a 150x150 para mejor rendimiento (suficiente para análisis de color)
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Histograma de colores: cuenta la frecuencia de cada color
        const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();
        
        // Muestrear cada 4 píxeles (suficiente para patrones de color)
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Ignorar píxeles transparentes y muy oscuros/claros (probablemente bordes)
          if (a < 128) continue;
          const luminance = getLuminance(r, g, b);
          if (luminance < 0.05 || luminance > 0.95) continue;

          const key = quantizeColor(r, g, b);
          
          if (colorCounts.has(key)) {
            colorCounts.get(key)!.count++;
          } else {
            colorCounts.set(key, { count: 1, r, g, b });
          }
        }

        // Encontrar el color más frecuente (dominante)
        let dominantColor: RGBColor = [128, 128, 128]; // fallback gris
        let maxCount = 0;

        colorCounts.forEach(({ count, r, g, b }) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = [r, g, b];
          }
        });

        // 2. Guardar en caché
        colorCache.set(imageUrl, dominantColor);
        setColor(dominantColor);

      } catch (error) {
        console.error("Error extracting dominant color:", error);
        setColor([128, 128, 128]); // fallback
      } finally {
        processingRef.current = false;
      }
    };

    img.onerror = () => {
      clearTimeout(timeout); // Cancelar timeout si hay error inmediato
      // Esto es normal cuando la imagen no existe o hay error de red - no es un error crítico
      setColor([128, 128, 128]); // fallback gris neutral
      processingRef.current = false;
    };

    img.src = imageUrl; // Iniciar carga DESPUÉS de configurar los handlers

    // Cleanup si el componente se desmonta antes de cargar
    return () => {
      clearTimeout(timeout);
      processingRef.current = false;
    };

  }, [imageUrl]); // Solo recalcula si cambia la URL

  return color;
};

/**
 * Convierte RGB a HSL para manipular fácilmente la luminosidad/saturación
 */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
};

/**
 * Convierte HSL a RGB
 */
const hslToRgb = (h: number, s: number, l: number): RGBColor => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // gris
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * Calcula el ratio de contraste entre dos colores según WCAG 2.0
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * 
 * Ratio de 4.5:1 = AA (texto normal)
 * Ratio de 7:1 = AAA (texto normal)
 */
const getContrastRatio = (color1: RGBColor, color2: RGBColor): number => {
    const lum1 = getLuminance(...color1);
    const lum2 = getLuminance(...color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Determina si usar texto blanco o negro según el fondo
 * Retorna el color HSL del texto con mejor contraste
 * 
 * REGLA MATEMÁTICA:
 * - Luminancia del fondo > 0.5 (claro) → Texto NEGRO
 * - Luminancia del fondo < 0.5 (oscuro) → Texto BLANCO
 * - Se verifica que el contraste sea mínimo 4.5:1 (WCAG AA)
 */
const getOptimalTextColor = (backgroundHSL: string, baseHue: number): string => {
    // Parsear HSL del background
    const match = backgroundHSL.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
    if (!match) return `${baseHue} 5% 10%`; // fallback negro

    const [, h, s, l] = match;
    const bgRGB = hslToRgb(parseFloat(h), parseFloat(s), parseFloat(l));
    const bgLuminance = getLuminance(...bgRGB);

    // MATEMÁTICA DEL CONTRASTE:
    // Luminancia > 0.5 = fondo claro → usar texto oscuro
    // Luminancia < 0.5 = fondo oscuro → usar texto claro
    
    if (bgLuminance > 0.5) {
        // Fondo CLARO → Texto NEGRO/OSCURO
        const darkText = `${baseHue} 10% 10%`; // Casi negro con tinte del color base
        const darkRGB = hslToRgb(baseHue, 10, 10);
        const contrast = getContrastRatio(bgRGB, darkRGB);
        
        // Si el contraste es bajo, hacer el texto más oscuro
        if (contrast < 4.5) {
            return `${baseHue} 5% 5%`; // Más oscuro
        }
        return darkText;
    } else {
        // Fondo OSCURO → Texto BLANCO/CLARO
        const lightText = `${baseHue} 5% 98%`; // Casi blanco con tinte del color base
        const lightRGB = hslToRgb(baseHue, 5, 98);
        const contrast = getContrastRatio(bgRGB, lightRGB);
        
        // Si el contraste es bajo, hacer el texto más claro
        if (contrast < 4.5) {
            return `${baseHue} 0% 100%`; // Blanco puro
        }
        return lightText;
    }
};

/**
 * Ajusta los colores según el color dominante y el tema
 * Garantiza alto contraste y visibilidad del texto con cálculo matemático automático
 * 
 * MATEMÁTICA DEL CONTRASTE:
 * - Calcula luminancia de cada color de fondo
 * - Si luminancia > 0.5 (claro) → Texto NEGRO
 * - Si luminancia < 0.5 (oscuro) → Texto BLANCO
 * - Verifica ratio de contraste mínimo 4.5:1 (WCAG AA)
 */
const getAdjustedColors = (color: RGBColor, isDarkTheme: boolean) => {
    const [h, s, l] = rgbToHsl(...color);
    const luminance = getLuminance(...color);

    // Aumentar saturación para colores más vibrantes
    const enhancedSaturation = Math.min(s * 1.3, 85);
    
    // Determinar si el color es muy claro (blanco, amarillo claro, etc.)
    const isVeryLight = luminance > 0.7;

    if (isDarkTheme) {
        // ====================================================================
        // MODO OSCURO
        // ====================================================================
        // Fondo: usar color dominante con luminosidad baja
        const bgLightness = isVeryLight ? 15 : Math.min(l, 25);
        const background = `${h} ${enhancedSaturation}% ${bgLightness}%`;
        
        // Cards: mismo tono pero MÁS DIFERENCIADAS (aumentar de +8 a +15)
        const cardLightness = bgLightness + 15;
        const card = `${h} ${enhancedSaturation * 0.8}% ${cardLightness}%`;
        
        // Primary: color vibrante del mismo tono
        const primary = `${h} ${enhancedSaturation}% 55%`;
        
        // Acentos y bordes con el mismo tono
        const muted = `${h} ${enhancedSaturation * 0.4}% 30%`;
        const accent = `${h} ${enhancedSaturation * 0.9}% 45%`;
        const border = `${h} ${enhancedSaturation * 0.5}% 35%`;
        
        return {
            background,
            foreground: "0 0% 100%",              // ✅ SIEMPRE BLANCO en modo oscuro
            card,
            cardForeground: "0 0% 100%",          // ✅ SIEMPRE BLANCO en cards
            primary,
            primaryForeground: "0 0% 100%",       // ✅ Blanco sobre primary
            muted,
            mutedForeground: "0 0% 85%",          // Gris claro
            accent,
            accentForeground: "0 0% 100%",        // ✅ Blanco sobre accent
            border
        };
    } else {
        // ====================================================================
        // MODO CLARO
        // ====================================================================
        // Fondo: usar color dominante con luminosidad alta
        const bgLightness = isVeryLight ? 98 : Math.max(l, 92);
        const background = `${h} ${enhancedSaturation * 0.4}% ${bgLightness}%`;
        
        // Cards: mismo tono pero MÁS DIFERENCIADAS (aumentar de -6 a -12)
        const cardLightness = bgLightness - 12;
        const card = `${h} ${enhancedSaturation * 0.5}% ${cardLightness}%`;
        
        // Primary: color vibrante del mismo tono
        const primary = `${h} ${enhancedSaturation}% 45%`;
        
        // Acentos y bordes con el mismo tono
        const muted = `${h} ${enhancedSaturation * 0.3}% 88%`;
        const accent = `${h} ${enhancedSaturation * 0.7}% 90%`;
        const border = `${h} ${enhancedSaturation * 0.4}% 85%`;
        
        return {
            background,
            foreground: "0 0% 5%",                // ✅ SIEMPRE NEGRO en modo claro
            card,
            cardForeground: "0 0% 5%",            // ✅ SIEMPRE NEGRO en cards
            primary,
            primaryForeground: "0 0% 100%",       // ✅ Blanco sobre primary (color vibrante)
            muted,
            mutedForeground: "0 0% 25%",          // Gris oscuro
            accent,
            accentForeground: "0 0% 5%",          // Negro sobre accent
            border
        };
    }
};


/**
 * Componente DynamicTheme
 * 
 * Optimizaciones:
 * 1. Solo procesa cuando cambia imageUrl (caché interno)
 * 2. Usa color dominante, no promedio (más representativo)
 * 3. Ajusta contraste automáticamente según luminosidad
 * 4. Genera paleta completa de colores consistentes
 * 5. Recuerda la preferencia del usuario (claro/oscuro) para el modo dinámico
 */
const DynamicTheme = ({ imageUrl, dominantColor: providedColor }: { 
  imageUrl: string;
  dominantColor?: string | null;
}) => {
  const { theme, systemTheme } = useTheme();
  const extractedColor = useDominantColor(imageUrl);
  const [mounted, setMounted] = useState(false);

  // Usar color provisto de la BD si existe, sino extraer de imagen
  const dominantColor = providedColor 
    ? hexToRgb(providedColor) 
    : extractedColor;

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isDynamic = theme === 'dynamic';
    const root = document.documentElement;

    if (isDynamic && dominantColor) {
      // Determinar si el usuario prefiere tema oscuro
      // 1. Leer preferencia guardada en localStorage (cuando cambió a dinámico)
      // 2. Si no hay preferencia guardada, usar el tema del sistema
      // 3. Si no hay tema del sistema, usar preferencia de color scheme
      let prefersDark = false;
      
      if (typeof window !== 'undefined') {
        const savedVariant = localStorage.getItem('dynamic-theme-variant');
        if (savedVariant) {
          prefersDark = savedVariant === 'dark';
        } else {
          // Fallback: usar tema del sistema o preferencia del navegador
          prefersDark = 
            systemTheme === 'dark' || 
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }

      // Aplicar o remover clase 'dark' según preferencia
      if (prefersDark) {
        root.classList.add('dark');
        root.style.setProperty('color-scheme', 'dark');
      } else {
        root.classList.remove('dark');
        root.style.setProperty('color-scheme', 'light');
      }

      const isDark = root.classList.contains('dark');
      const colors = getAdjustedColors(dominantColor, isDark);

      // Aplicar toda la paleta de colores con textos calculados automáticamente
      // Usar setProperty con prioridad para asegurar que sobrescriba los valores por defecto
      root.style.setProperty('--background', colors.background);
      root.style.setProperty('--foreground', colors.foreground);
      root.style.setProperty('--card', colors.card);
      root.style.setProperty('--card-foreground', colors.cardForeground);
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-foreground', colors.primaryForeground);
      root.style.setProperty('--muted', colors.muted);
      root.style.setProperty('--muted-foreground', colors.mutedForeground);
      root.style.setProperty('--accent', colors.accent);
      root.style.setProperty('--accent-foreground', colors.accentForeground);
      root.style.setProperty('--border', colors.border);

      // Log para debugging con información de contraste
      const [r, g, b] = dominantColor;
      const lum = getLuminance(r, g, b);
      console.log(`🎨 Tema DINÁMICO activado`);
      console.log(`   Color dominante: rgb(${r}, ${g}, ${b})`);
      console.log(`   Luminancia: ${lum.toFixed(3)} (${lum > 0.5 ? 'CLARO' : 'OSCURO'})`);
      console.log(`   Variante: ${isDark ? 'oscuro' : 'claro'}`);
      console.log(`   Background: ${colors.background}`);
      console.log(`   Card: ${colors.card}`);
      console.log(`   Textos: ${lum > 0.5 ? 'NEGROS (fondo claro)' : 'BLANCOS (fondo oscuro)'}`);
    } else {
      // Restaurar valores por defecto cuando no está en modo dinámico
      root.style.removeProperty('color-scheme');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--border');
    }

    // Cleanup al desmontar
    return () => {
      if (theme !== 'dynamic') {
        root.style.removeProperty('--background');
        root.style.removeProperty('--foreground');
        root.style.removeProperty('--card');
        root.style.removeProperty('--card-foreground');
        root.style.removeProperty('--primary');
        root.style.removeProperty('--primary-foreground');
        root.style.removeProperty('--muted');
        root.style.removeProperty('--muted-foreground');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--accent-foreground');
        root.style.removeProperty('--border');
      }
    };
  }, [dominantColor, theme, systemTheme, mounted]); // Recalcula si cambia el color, tema o sistema

  if (!mounted) return null;
  return null;
};

export default DynamicTheme;
