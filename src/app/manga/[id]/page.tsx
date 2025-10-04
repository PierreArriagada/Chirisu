/**
 * @fileoverview Página de detalles para un manga específico.
 * 
 * Página de servidor para mostrar los detalles de un manga.
 * Su estructura es idéntica a las otras páginas de medios, obteniendo los datos
 * y renderizando el componente `MediaPage`.
 */

import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db";
import type { Metadata } from 'next';
import { notFound } from "next/navigation";


type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mediaData = getMediaPageData(params.id, 'manga');

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
  const mediaData = getMediaPageData(params.id, 'manga');

  if (!mediaData) {
    notFound();
  }

  return <MediaPage mediaData={mediaData} />;
}
