import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db";
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mediaData = getMediaPageData(params.id, 'novela');

  if (!mediaData) {
    return {
      title: 'Contenido no encontrado',
      description: 'La página que buscas no existe.',
    }
  }

  const alternativeTitles = mediaData.details.alternativeTitles.map(alt => alt.title);

  return {
    title: `${mediaData.titleInfo.title} | AniHub Info`,
    description: mediaData.titleInfo.description,
    keywords: [mediaData.titleInfo.title, ...alternativeTitles],
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const mediaData = getMediaPageData(params.id, 'novela');

  if (!mediaData) {
    return <div className="text-center p-8">Contenido no encontrado.</div>;
  }

  return <MediaPage mediaData={mediaData} />;
}
