import { AnimePageClient } from '@/components/media';
import { AllMediaCatalog } from '@/components/catalog';

export default function ManhwaPage() {
  return (
    <div className="my-8">
      <AnimePageClient mediaType="Manhwa" />
      <AllMediaCatalog mediaType="manhwa" title="Todos los Manhwa" />
    </div>
  );
}
