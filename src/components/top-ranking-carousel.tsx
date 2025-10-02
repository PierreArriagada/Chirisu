'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Bookmark, MessageCircle } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TopRankingSlideshowProps {
  items: TitleInfo[];
}

const DotButton = ({ selected, onClick }: { selected: boolean, onClick: () => void }) => (
    <button
      className={cn(
        "h-2 w-2 rounded-full transition-all duration-300",
        selected ? "w-4 bg-primary" : "bg-muted-foreground/50"
      )}
      type="button"
      onClick={onClick}
    />
  );
  

const TopRankingSlideshow = ({ items }: TopRankingSlideshowProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, setScrollSnaps, onSelect]);

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
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((item, index) => (
            <div key={item.id} className="relative flex-[0_0_100%] group p-1">
              <Card className="overflow-hidden">
                  <div className="flex flex-row bg-card">
                      {/* Left side - Image */}
                      <div className="w-1/2 relative aspect-[3/4] flex-shrink-0">
                          <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                              data-ai-hint={item.imageHint}
                              priority={index < 2}
                          />
                      </div>

                      {/* Right side - Info */}
                      <div className="w-1/2 p-6 flex flex-col relative">
                          <div className="flex-grow">
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
                              
                              <p className="text-sm text-muted-foreground line-clamp-3 z-10">
                                  {item.description}
                              </p>
                          </div>

                          <div className="flex justify-end mt-4 z-10">
                              <Link href={url(item)}>
                                 <Button>Leer más</Button>
                              </Link>
                          </div>
                      </div>
                  </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center items-center gap-2 mt-4">
        {scrollSnaps.map((_, index) => (
            <DotButton
            key={index}
            selected={index === selectedIndex}
            onClick={() => scrollTo(index)}
            />
        ))}
      </div>
    </div>
  );
};

export default TopRankingSlideshow;