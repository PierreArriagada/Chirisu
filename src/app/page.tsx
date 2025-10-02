import { getMediaListPage } from '@/lib/db';
import { MediaType } from '@/lib/types';
import TopRankingCarousel from '@/components/top-ranking-carousel';

export default function Home() {
  const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Manhua', 'Manwha', 'Novela', 'Fan Comic', 'Dougua'];

  return (
    <main className="space-y-8 my-8">
      {mediaTypes.map(type => {
        const { topAllTime } = getMediaListPage(type);
        // Capitalize first letter of type for the link
        const typePath = type.charAt(0).toUpperCase() + type.slice(1);
        
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
