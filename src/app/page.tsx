import CoreInfoCard from '@/components/core-info-card';
import Recommendations from '@/components/recommendations';
import SynopsisCard from '@/components/synopsis-card';
import { mockTitle } from '@/lib/data';

export default function Home() {
  const titleInfo = mockTitle;

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto p-2 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <CoreInfoCard titleInfo={titleInfo} />
            <SynopsisCard description={titleInfo.description} />
            <div className="lg:hidden">
              <h2 className="text-2xl font-headline mb-4">You might also like</h2>
              <Recommendations titleInfo={titleInfo} />
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4 sticky top-8 h-max">
            <h2 className="text-2xl font-headline">You might also like</h2>
            <Recommendations titleInfo={titleInfo} />
          </div>
        </div>
      </main>
    </div>
  );
}
