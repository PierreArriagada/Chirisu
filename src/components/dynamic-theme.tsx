/**
 * @fileoverview DynamicTheme - Componente para aplicar un tema de color dinámico.
 * 
 * Este componente utiliza la librería `colorthief` para extraer el color dominante
 * de una imagen proporcionada (`imageUrl`). Luego, si el tema "dinámico" está activo,
 * ajusta las variables CSS de la aplicación (como fondo, primario, etc.) para
 * que coincidan con la paleta de colores de la imagen.
 * Cuando el tema dinámico se desactiva, se encarga de restaurar los colores originales.
 */

'use client';

import { useEffect } from 'react';
import ColorThief from 'colorthief';
import { useTheme } from 'next-themes';

interface DynamicThemeProps {
  imageUrl: string;
}

// Helper function to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

const getBestColorFromPalette = (palette: [number, number, number][]): [number, number, number] => {
    if (!palette || palette.length === 0) return [0, 0, 0];

    const filteredPalette = palette.map(color => {
        const [r, g, b] = color;
        const [h, s, l] = rgbToHsl(r, g, b);
        // Descartar colores muy oscuros o muy claros
        if (l < 10 || l > 90) return null;
        return { color, h, s, l };
    }).filter(Boolean) as { color: [number, number, number], h: number, s: number, l: number }[];

    if (filteredPalette.length === 0) {
        return palette[0];
    }

    // Ordenar por saturación descendente para obtener el color más vibrante
    filteredPalette.sort((a, b) => b.s - a.s);

    return filteredPalette[0].color;
};

const DynamicTheme = ({ imageUrl }: DynamicThemeProps) => {
  const { theme, systemTheme } = useTheme();
  const isDynamic = theme === 'dynamic' || (theme === 'system' && systemTheme === 'dynamic');

  useEffect(() => {
    if (!isDynamic) {
        // If not in dynamic theme, ensure default styles are applied
        document.documentElement.style.removeProperty('--background');
        document.documentElement.style.removeProperty('--card');
        document.documentElement.style.removeProperty('--primary');
        return;
    };

    const img = document.getElementById('media-cover-image') as HTMLImageElement | null;
    if (!img) return;

    // Store original values to revert back to
    const originalValues = {
        background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
        card: getComputedStyle(document.documentElement).getPropertyValue('--card'),
        primary: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
    };

    const applyTheme = (color: [number, number, number]) => {
      const [r, g, b] = color;
      const [h, s, l] = rgbToHsl(r, g, b);
      
      const isDark = document.documentElement.classList.contains('dark');
      
      // The extracted color defines the background hue and saturation
      const backgroundHue = h;
      const backgroundSaturation = Math.min(s, 60); // Cap saturation for background

      // Set background and card colors based on the theme
      if (isDark) {
          document.documentElement.style.setProperty('--background', `${backgroundHue} ${backgroundSaturation}% 10%`);
          document.documentElement.style.setProperty('--card', `${backgroundHue} ${backgroundSaturation}% 15%`);
          document.documentElement.style.setProperty('--primary', `${backgroundHue} 80% 80%`); // Contrasting light primary
      } else {
          document.documentElement.style.setProperty('--background', `${backgroundHue} ${backgroundSaturation}% 96%`);
          document.documentElement.style.setProperty('--card', `${backgroundHue} ${backgroundSaturation}% 100%`);
          document.documentElement.style.setProperty('--primary', `${backgroundHue} 70% 40%`); // Contrasting dark primary
      }
    };

    const handleLoad = () => {
      try {
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'Anonymous';
        proxyImg.src = img.src;
        proxyImg.onload = () => {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(proxyImg, 5);
            const bestColor = getBestColorFromPalette(palette);
            applyTheme(bestColor);
        };
      } catch (e) {
        console.error('Error getting color from image:', e);
      }
    };
    
    if (img.complete) {
        handleLoad();
    } else {
        img.addEventListener('load', handleLoad);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      // Revert to original CSS variables when component unmounts or theme changes
      document.documentElement.style.setProperty('--background', originalValues.background);
      document.documentElement.style.setProperty('--card', originalValues.card);
      document.documentElement.style.setProperty('--primary', originalValues.primary);
    };
  }, [imageUrl, isDynamic]);

  return null;
};

export default DynamicTheme;
