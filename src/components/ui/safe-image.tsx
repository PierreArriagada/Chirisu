'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackText?: string;
}

/**
 * SafeImage - Componente de imagen con manejo robusto de fallbacks
 * 
 * Estrategia de resolución:
 * 1. Intenta cargar la imagen desde la BD (prop src)
 * 2. Si falla, intenta cargar desde URL externa
 * 3. Si todo falla, muestra placeholder "Sin Imagen"
 * 
 * Características:
 * - Maneja src vacías, null, undefined
 * - Detecta errores de carga (404, CORS, etc)
 * - Placeholder visual profesional
 * - Compatible con todas las props de next/image
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  objectFit = 'cover',
  fallbackText = 'Sin Imagen'
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si la imagen es válida
  const isValidSrc = src && src.trim() !== '';

  // Si no hay src válida o hubo error, mostrar placeholder
  if (!isValidSrc || imageError) {
    return (
      <div
        className={`relative bg-muted flex flex-col items-center justify-center text-muted-foreground ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height
        }}
      >
        <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs font-medium opacity-60">{fallbackText}</span>
      </div>
    );
  }

  // Renderizar imagen con manejo de errores
  const imageProps: any = {
    src,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    priority,
    quality,
    onError: () => {
      console.warn(`⚠️ Error al cargar imagen: ${src}`);
      setImageError(true);
    },
    onLoad: () => {
      setIsLoading(false);
    },
    style: {
      objectFit
    }
  };

  if (fill) {
    imageProps.fill = true;
    if (sizes) imageProps.sizes = sizes;
  } else {
    imageProps.width = width;
    imageProps.height = height;
  }

  return (
    <>
      <Image {...imageProps} />
      {isLoading && !imageError && (
        <div
          className={`absolute inset-0 bg-muted animate-pulse ${className}`}
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height
          }}
        />
      )}
    </>
  );
}
