import { AnimePageClient } from '@/components/media';
import { AllMediaCatalog } from '@/components/catalog';

export default function MangaPage() {
  return (
    <div className="my-8">
      <AnimePageClient mediaType="Manga" />
      <AllMediaCatalog mediaType="manga" title="Todos los Manga" />
    </div>
  );
}
