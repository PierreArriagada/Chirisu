import { AnimePageClient } from '@/components/media';
import { AllMediaCatalog } from '@/components/catalog';

export default function FanComicPage() {
  return (
    <div className="my-8">
      <AnimePageClient mediaType="Fan Comic" />
      <AllMediaCatalog mediaType="fan_comic" title="Todos los Fan Comics" />
    </div>
  );
}
