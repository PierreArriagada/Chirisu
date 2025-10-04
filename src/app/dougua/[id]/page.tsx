/**
 * @fileoverview Página de detalles para un dougua específico.
 * 
 * Similar a la página de anime, esta es una página de renderizado dinámico del lado del servidor
 * que muestra información detallada sobre un dougua (animación china), identificado por su ID.
 * - Genera metadatos SEO dinámicos.
 * - Obtiene los datos del dougua usando `getMediaPageData`.
 * - Renderiza el componente `MediaPage` para mostrar la información.
 * - Muestra una página 404 si el dougua no se encuentra.
 */

import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db";
import type { Metadata } from 'next';
import { notFound } from "next/navigation";


type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mediaData = getMediaPageData(params.id, 'dougua');

  if (!mediaData) {
    return {
      title: 'Contenido no encontrado',
      description: 'La página que buscas no existe.',
    }
  }

  const alternativeTitles = mediaData.details.alternativeTitles.map(alt => alt.title);

  return {
    title: `${mediaData.titleInfo.title} | Chirisu`,
    description: mediaData.titleInfo.description,
    keywords: [mediaData.titleInfo.title, ...alternativeTitles],
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const mediaData = getMediaPageData(params.id, 'dougua');

  if (!mediaData) {
    notFound();
  }

  return <MediaPage mediaData={mediaData} />;
}
