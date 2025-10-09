/**
 * @fileoverview DynamicTheme - Componente para aplicar un tema de color dinámico.
 * 
 * Este componente utiliza un canvas para extraer el color promedio de una imagen
 * de portada. Luego, si el tema "dinámico" está activo, ajusta las variables
 * CSS de la aplicación (background, card, primary) para que coincidan con la
 * paleta de colores de la imagen, asegurando la legibilidad mediante el cálculo
 * de la luminancia.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type RGBColor = [number, number, number];

// Hook para extraer el color promedio de una imagen
const useAverageColor = (imageUrl: string) => {
  const [color, setColor] = useState<RGBColor | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let r = 0, g = 0, b = 0;
      let count = 0;

      // Muestrear cada 400 píxeles (100x4) para un buen rendimiento
      for (let i = 0; i < data.length; i += 400) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      const avgR = Math.floor(r / count);
      const avgG = Math.floor(g / count);
      const avgB = Math.floor(b / count);

      setColor([avgR, avgG, avgB]);
    };

    img.onerror = () => {
      console.error("Error loading image for color extraction.");
      setColor(null); // Fallback
    }

  }, [imageUrl]);

  return color;
};

// Convierte RGB a HSL para manipular fácilmente la luminosidad/saturación
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

const getAdjustedColors = (color: RGBColor, isDarkTheme: boolean) => {
    const [h, s, l] = rgbToHsl(...color);

    const baseSaturation = Math.min(s, 60);

    if (isDarkTheme) {
        // En tema oscuro, queremos fondos oscuros.
        const backgroundLightness = l < 15 ? l + 5 : Math.max(10, Math.min(l, 20));
        const cardLightness = backgroundLightness + 5;
        const primaryLightness = Math.max(70, 100 - l); // Color de acento claro y vibrante

        return {
            background: `${h} ${baseSaturation}% ${backgroundLightness}%`,
            card: `${h} ${baseSaturation}% ${cardLightness}%`,
            primary: `${h} ${Math.min(s + 20, 90)}% ${primaryLightness}%`
        }
    } else {
        // En tema claro, queremos fondos claros.
        const backgroundLightness = l > 85 ? l - 5 : Math.min(96, Math.max(l, 80));
        const cardLightness = backgroundLightness + 4;
        const primaryLightness = Math.max(30, Math.min(l - 30, 50)); // Color de acento oscuro y vibrante

        return {
            background: `${h} ${baseSaturation}% ${backgroundLightness}%`,
            card: `${h} ${baseSaturation}% ${cardLightness}%`,
            primary: `${h} ${Math.min(s + 10, 80)}% ${primaryLightness}%`
        }
    }
};


const DynamicTheme = ({ imageUrl }: { imageUrl: string }) => {
  const { theme } = useTheme();
  const averageColor = useAverageColor(imageUrl);

  useEffect(() => {
    const isDynamic = theme === 'dynamic';
    const root = document.documentElement;

    if (isDynamic && averageColor) {
      const isDark = root.classList.contains('dark');
      const { background, card, primary } = getAdjustedColors(averageColor, isDark);

      root.style.setProperty('--background', background);
      root.style.setProperty('--card', card);
      root.style.setProperty('--primary', primary);
    }

    // Función de limpieza para restaurar los valores por defecto
    return () => {
      root.style.removeProperty('--background');
      root.style.removeProperty('--card');
      root.style.removeProperty('--primary');
    };
  }, [imageUrl, averageColor, theme]);

  return null;
};

export default DynamicTheme;
