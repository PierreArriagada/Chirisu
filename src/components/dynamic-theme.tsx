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

      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      let bgLuminance, cardLuminance;
      const isDark = document.documentElement.classList.contains('dark');
      
      if (isDark) {
        bgLuminance = Math.min(15, l * 0.8);
        cardLuminance = Math.min(20, l * 0.8 + 5);
      } else {
        bgLuminance = Math.max(90, l + (100 - l) * 0.8);
        cardLuminance = Math.max(95, l + (100 - l) * 0.9);
      }


      document.documentElement.style.setProperty('--background', `${h} ${s}% ${bgLuminance}%`);
      document.documentElement.style.setProperty('--card', `${h} ${s}% ${cardLuminance}%`);
      
      const primarySaturation = Math.min(100, s + 20);
      const primaryLuminance = isDark ? Math.min(60, l + 25) : Math.max(40, l - 25);
      document.documentElement.style.setProperty('--primary', `${h} ${primarySaturation}% ${primaryLuminance}%`);
    };

    const handleLoad = () => {
      try {
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'Anonymous';
        proxyImg.src = img.src;
        proxyImg.onload = () => {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(proxyImg);
            applyTheme(dominantColor);
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
