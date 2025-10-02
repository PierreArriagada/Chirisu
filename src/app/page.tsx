import { getMediaListPage } from '@/lib/db';
import { MediaType } from '@/lib/types';
import TopRankingCarousel from '@/components/top-ranking-carousel';

export default function Home() {
  const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Manhua', 'Manwha', 'Novela', 'Fan Comic', 'Dougua'];

  return (
    <main className="space-y-12 my-8">
      {mediaTypes.map(type => {
        const { topAllTime } = getMediaListPage(type);
        
        // Handle multi-word types for path
        const path = `/${type.toLowerCase().replace(' ', '-')}`;

        return (
          <TopRankingCarousel
            key={type}
            title={`${type} - Top Ranking`}
            items={topAllTime}
            viewMoreLink={path}
          />
        );
      })}
    </main>
  );
}
