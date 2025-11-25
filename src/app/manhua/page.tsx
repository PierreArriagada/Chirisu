import { AnimePageClient } from '@/components/media';
import { AllMediaCatalog } from '@/components/catalog';

export default function ManhuaPage() {
  return (
    <div className="my-8">
      <AnimePageClient mediaType="Manhua" />
      <AllMediaCatalog mediaType="manhua" title="Todos los Manhua" />
    </div>
  );
}
