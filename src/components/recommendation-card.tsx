import Image from 'next/image';
import { Card } from '@/components/ui/card';
import type { RecommendationInfo } from '@/lib/types';
import { Badge } from './ui/badge';

export default function RecommendationCard({ recommendation }: { recommendation: RecommendationInfo }) {
  const seed = recommendation.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageHint = `${recommendation.type} poster`;

  return (
    <a href="#" className="block group">
      <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 group-hover:bg-accent/50 group-hover:shadow-md">
        <div className="flex-shrink-0">
          <Image
            src={`https://picsum.photos/seed/${seed}/100/150`}
            alt={`Cover for ${recommendation.title}`}
            width={50}
            height={75}
            className="rounded-md object-cover aspect-[2/3]"
            data-ai-hint={imageHint}
          />
        </div>
        <div className="flex flex-col justify-center gap-1 overflow-hidden">
          <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{recommendation.title}</h4>
          <Badge variant="secondary" className='capitalize w-min'>{recommendation.type}</Badge>
        </div>
      </Card>
    </a>
  );
}
