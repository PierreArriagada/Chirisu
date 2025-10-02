'use client';

import React, { useEffect } from 'react';
import { Star, Bookmark, MessageCircle } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface TopRankingSlideshowProps {
  items: TitleInfo[];
}

const TopRankingSlideshow = ({ items }: TopRankingSlideshowProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: true, duration: 50 }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      const formatted = (num / 1_000_000).toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
    }
    if (num >= 1_000) {
      const formatted = (num / 1_000).toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'k';
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
          <div key={item.id} className="relative flex-[0_0_100%] aspect-[16/7] group cursor-pointer">
            <Link href={url(item)} className="block w-full h-full">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={item.imageHint}
                priority={index === 0} // Prioritize loading the first image
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Ranking Number */}
              <div className="absolute top-4 right-4 font-headline font-bold text-5xl md:text-7xl text-white/90 drop-shadow-lg">
                {index + 1}
              </div>
              
              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                <h3 className="font-bold text-lg md:text-2xl font-headline line-clamp-2 group-hover:text-primary-foreground/80 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs md:text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{item.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{formatNumber(item.listsCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{formatNumber(item.commentsCount)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRankingSlideshow;
