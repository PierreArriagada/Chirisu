/**
 * @fileoverview Página de detalles para un anime específico.
 * 
<<<<<<< HEAD
 * Esta es una página que muestra información detallada sobre un anime,
 * identificado por su ID en la URL.
 * Ahora usa el componente cliente MediaPageClient que carga datos desde la API.
 */

import { MediaPageClient } from '@/components/media';
=======
 * Esta es una página de renderizado dinámico del lado del servidor que muestra
 * información detallada sobre un anime, identificado por su ID en la URL.
 * - Utiliza `generateMetadata` para establecer metadatos SEO dinámicos (título, descripción).
 * - Obtiene los datos del anime usando `getMediaPageData`, que ahora hace una llamada a la API.
 * - Renderiza el componente `MediaPage`, que actúa como la plantilla principal para
 *   mostrar toda la información del título.
 * - Muestra una página 404 si el anime no se encuentra.
 */

import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db-api"; // Cambiado a la nueva función de API
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
<<<<<<< HEAD
  const { id } = await params;
  // TODO: Podríamos hacer fetch aquí para metadata más precisa
=======
  const mediaData = await getMediaPageData(params.id, 'anime');

  if (!mediaData) {
    return {
      title: 'Contenido no encontrado',
      description: 'La página que buscas no existe.',
    }
  }

  const alternativeTitles = mediaData.details.alternativeTitles.map(alt => alt.title);

>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
  return {
    title: `Anime ${id} | Chirisu`,
    description: 'Detalles del anime',
  }
}

<<<<<<< HEAD
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Anime" />;
=======
export default async function Page({ params }: { params: { id: string } }) {
  // Ahora usamos await porque getMediaPageData es asíncrono (llama a la API)
  const mediaData = await getMediaPageData(params.id, 'anime');

  if (!mediaData) {
    notFound();
  }

  return <MediaPage mediaData={mediaData} />;
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
}
