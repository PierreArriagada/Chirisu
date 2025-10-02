/**
 * @fileoverview MediaGallery - Galería de imágenes para un título.
 * 
 * Este componente recibe un array de objetos de imagen y las renderiza en
 * una cuadrícula (grid) responsiva. Cada imagen es un enlace que podría,
 * en una futura implementación, abrir una vista de lightbox o una página
 * de detalle de la imagen. Se utiliza en la página de detalles del medio
 * para mostrar arte conceptual, capturas de pantalla, etc.
 */

import type { GalleryImage } from "@/lib/types";
import Image from "next/image";

export default function MediaGallery({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {images.map(image => (
        <div key={image.id} className="relative aspect-video">
          <Image 
            src={image.imageUrl} 
            alt="Gallery image" 
            fill 
            className="rounded-lg object-cover"
            data-ai-hint={image.imageHint}
          />
        </div>
      ))}
    </div>
  );
}
