'use client';

/**
 * @fileoverview CharacterImage - Componente client para mostrar imagen de personaje.
 * 
 * Este pequeño componente client maneja la carga de imágenes con fallback.
 * Se mantiene como client component solo por el event handler onError.
 */

interface CharacterImageProps {
  imageUrl: string;
  name: string;
  width?: number;
  height?: number;
}

export function CharacterImage({ 
  imageUrl, 
  name, 
  width = 40, 
  height = 60 
}: CharacterImageProps) {
  return (
    <div 
      className="rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0"
      style={{ width, height }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = `
              <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                <span class="text-xs font-bold text-primary">
                  ${name.charAt(0).toUpperCase()}
                </span>
              </div>
            `;
          }
        }}
      />
    </div>
  );
}
