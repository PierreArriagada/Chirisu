import { AnimePageClient } from '@/components/media';
import { AllMediaCatalog } from '@/components/catalog';

export default function DonghuaPage() {
  return (
    <div className="my-8">
      <AnimePageClient mediaType="Donghua" />
      <AllMediaCatalog mediaType="donghua" title="Todos los Donghua" />
    </div>
  );
}
