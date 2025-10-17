/**
 * @fileoverview MediaGallery - Galería multimedia para un título.
 * 
 * Este componente muestra tráilers, videos promocionales e imágenes
 * en pestañas organizadas. Se utiliza en la página de detalles del medio
 * para mostrar contenido multimedia como arte conceptual, capturas de pantalla,
 * tráilers oficiales, etc.
 */

import type { GalleryImage } from "@/lib/types";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";

interface Trailer {
  id?: string;
  site: string;
  url: string;
  thumbnail?: string;
}

interface Video {
  id?: string;
  title: string;
  url: string;
  thumbnail?: string;
}

interface MediaGalleryProps {
  trailers?: Trailer[];
  videos?: Video[];
  images?: GalleryImage[];
}

export default function MediaGallery({ trailers = [], videos = [], images = [] }: MediaGalleryProps) {
  const hasTrailers = trailers.length > 0;
  const hasVideos = videos.length > 0;
  const hasImages = images.length > 0;

  // Si no hay contenido, mostrar mensaje
  if (!hasTrailers && !hasVideos && !hasImages) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Sin información de multimedia disponible.
      </div>
    );
  }

  return (
    <Tabs defaultValue={hasTrailers ? "trailers" : hasVideos ? "videos" : "images"} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="trailers" disabled={!hasTrailers}>
          Tráilers {hasTrailers && `(${trailers.length})`}
        </TabsTrigger>
        <TabsTrigger value="videos" disabled={!hasVideos}>
          Videos {hasVideos && `(${videos.length})`}
        </TabsTrigger>
        <TabsTrigger value="images" disabled={!hasImages}>
          Imágenes {hasImages && `(${images.length})`}
        </TabsTrigger>
      </TabsList>

      {/* Tráilers */}
      <TabsContent value="trailers" className="mt-4">
        {hasTrailers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trailers.map((trailer, index) => (
              <div key={trailer.id || index} className="relative aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={trailer.url}
                  title={`Tráiler ${index + 1}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Sin tráilers disponibles.</p>
        )}
      </TabsContent>

      {/* Videos */}
      <TabsContent value="videos" className="mt-4">
        {hasVideos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => (
              <div key={video.id || index} className="space-y-2">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={video.url}
                    title={video.title || `Video ${index + 1}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                {video.title && (
                  <p className="text-sm font-medium text-center">{video.title}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Sin videos disponibles.</p>
        )}
      </TabsContent>

      {/* Imágenes */}
      <TabsContent value="images" className="mt-4">
        {hasImages ? (
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
        ) : (
          <p className="text-muted-foreground text-center py-4">Sin imágenes disponibles.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
