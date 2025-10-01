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
