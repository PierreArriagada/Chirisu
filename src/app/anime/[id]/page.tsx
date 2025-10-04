/**
 * @fileoverview Página de detalles para un anime específico.
 * 
 * Esta es una página de renderizado dinámico del lado del servidor que muestra
 * información detallada sobre un anime, identificado por su ID en la URL.
 * - Utiliza `generateMetadata` para establecer metadatos SEO dinámicos (título, descripción).
 * - Obtiene los datos del anime usando `getMediaPageData`.
 * - Renderiza el componente `MediaPage`, que actúa como la plantilla principal para
 *   mostrar toda la información del título.
 * - Muestra una página 404 si el anime no se encuentra.
 */

import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db";
import type { Metadata } from 'next';
import { notFound } from "next/navigation";

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mediaData = getMediaPageData(params.id, 'anime');

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
  const mediaData = getMediaPageData(params.id, 'anime');

  if (!mediaData) {
    notFound();
  }

  return <MediaPage mediaData={mediaData} />;
}
