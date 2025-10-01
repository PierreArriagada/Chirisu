import MediaPage from "@/components/media-page";
import { getMediaPageData } from "@/lib/db";

export default function Page({ params }: { params: { id: string } }) {
  const mediaData = getMediaPageData(params.id, 'manhua');

  if (!mediaData) {
    return <div className="text-center p-8">Contenido no encontrado.</div>;
  }

  return <MediaPage mediaData={mediaData} />;
}
