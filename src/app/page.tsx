import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHomePageData } from '@/lib/db';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

function MediaCard({ item }: { item: any }) {
  const url = `/${item.type.toLowerCase().replace(' ', '-')}/${item.id}`;
  return (
    <Link href={url} className="block group">
      <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
        <div className="relative w-full aspect-[2/3]">
          <Image 
            src={item.imageUrl} 
            alt={`Cover for ${item.title}`}
            fill
            className="object-cover"
            data-ai-hint={item.imageHint}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <Badge variant="secondary" className="w-min mb-2 capitalize">{item.type}</Badge>
          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
        </div>
      </Card>
    </Link>
  );
}

export default function Home() {
  const allMedia = getHomePageData();

  return (
    <main className="p-4 sm:p-8">
      <h1 className="text-4xl font-headline mb-8 text-center">Variedades</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {allMedia.map(item => (
          <MediaCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </main>
  );
}
