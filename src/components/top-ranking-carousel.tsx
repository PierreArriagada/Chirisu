'use client';

import React from 'react';
import { Star, Bookmark, MessageCircle } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface TopRankingSlideshowProps {
  items: TitleInfo[];
}

const TopRankingSlideshow = ({ items }: TopRankingSlideshowProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: true, duration: 50 }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };
  
  const url = (item: TitleInfo) => `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex-[0_0_100%] group p-1">
            <Card className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left side - Info */}
                    <div className="relative p-6 md:w-1/2 flex flex-col justify-center">
                        <div className="absolute top-2 left-2 font-headline font-bold text-6xl text-primary/10 select-none">
                            {index + 1}
                        </div>
                        <h3 className="font-bold text-2xl font-headline line-clamp-2 mb-2 z-10">
                            {item.title}
                        </h3>

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-4 z-10">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-sm">{item.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>{formatNumber(item.listsCount)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{formatNumber(item.commentsCount)}</span>
                            </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 z-10">
                            {item.description}
                        </p>

                        <Link href={url(item)} className="z-10 self-start">
                           <Button>Leer más</Button>
                        </Link>
                    </div>

                    {/* Right side - Image */}
                    <div className="md:w-1/2 aspect-[4/3] md:aspect-auto relative">
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            data-ai-hint={item.imageHint}
                            priority={index < 2}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent md:bg-gradient-to-r md:from-card md:via-transparent md:to-transparent"></div>
                    </div>
                </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRankingSlideshow;
