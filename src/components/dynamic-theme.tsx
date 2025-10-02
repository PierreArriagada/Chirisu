
'use client';

import { useEffect } from 'react';
import ColorThief from 'colorthief';

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
  useEffect(() => {
    // Find the main image already rendered on the page by its ID
    const img = document.getElementById('media-cover-image') as HTMLImageElement | null;
    
    if (!img) return;

    const originalValues = {
        background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
        card: getComputedStyle(document.documentElement).getPropertyValue('--card'),
        primary: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
    };

    const applyTheme = (color: [number, number, number]) => {
      const [r, g, b] = color;
      const [h, s, l] = rgbToHsl(r, g, b);

      // Determine if the color is light or dark to adjust luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      let bgLuminance = l < 10 ? 10 : l > 90 ? 90 : l;
      let cardLuminance = l < 10 ? 15 : l > 90 ? 95 : l + 5;
      
      if (luminance > 0.5) { // Light color
          bgLuminance = Math.max(85, l);
          cardLuminance = Math.max(90, l + 5);
      } else { // Dark color
          bgLuminance = Math.min(15, l);
          cardLuminance = Math.min(20, l + 5);
      }

      document.documentElement.style.setProperty('--background', `${h} ${s}% ${bgLuminance}%`);
      document.documentElement.style.setProperty('--card', `${h} ${s}% ${cardLuminance}%`);
      
      // Make primary a more saturated version
      const primarySaturation = Math.min(100, s + 20);
      const primaryLuminance = luminance > 0.5 ? Math.max(40, l - 15) : Math.min(60, l + 15);
      document.documentElement.style.setProperty('--primary', `${h} ${primarySaturation}% ${primaryLuminance}%`);
    };

    const handleLoad = () => {
      try {
        // Since the image is from a different origin, we still need to fetch it in a way
        // that allows canvas access. The browser might have it cached.
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
    
    // If the image is already loaded, run the logic. Otherwise, wait for it to load.
    if (img.complete) {
        handleLoad();
    } else {
        img.addEventListener('load', handleLoad);
    }


    return () => {
      img.removeEventListener('load', handleLoad);
      // Revert to original CSS variables when component unmounts
      document.documentElement.style.setProperty('--background', originalValues.background);
      document.documentElement.style.setProperty('--card', originalValues.card);
      document.documentElement.style.setProperty('--primary', originalValues.primary);
    };
  }, [imageUrl]);

  return null;
};

export default DynamicTheme;
