/**
 * @fileoverview TopRankingSlideshow - A full-width, auto-playing slideshow for category pages.
 * 
 * This component is designed to be a prominent feature at the top of category pages
 * like /anime, /manga, etc. It displays a visually striking, auto-playing carousel
 * of the top 5 daily ranked items. Each slide features a large background image
 * with the title, ranking, and other information overlaid.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { Star, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TopRankingSlideshowProps {
  items: TitleInfo[];
}

export default function TopRankingSlideshow({ items }: TopRankingSlideshowProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);


  if (!items || items.length === 0) {
    return null;
  }
  
  const url = (item: TitleInfo) => `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;

  return (
    <section className="w-full relative group/slideshow">
        <h2 className="text-xl md:text-2xl font-bold font-headline mb-3 md:mb-4">Top Diario</h2>
        <Carousel
            setApi={setApi}
            opts={{
                align: 'start',
                loop: true,
            }}
            plugins={[
                Autoplay({
                delay: 6000,
                stopOnInteraction: true,
                }),
            ]}
            className="w-full rounded-lg overflow-hidden"
        >
            <CarouselContent>
            {items.slice(0, 5).map((item, index) => (
                <CarouselItem key={index}>
                    <Link href={url(item)} className="block group cursor-pointer">
                         <Card className="border-none">
                            <CardContent className="p-0 relative aspect-video md:aspect-[2.5/1]">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    data-ai-hint={item.imageHint}
                                    priority={index < 2}
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white w-full flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                    <div className="md:flex-1">
                                        <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                            #{index + 1}
                                        </h3>
                                        <h4 className="text-xl sm:text-2xl md:text-3xl font-bold group-hover:text-primary-foreground/80 transition-colors line-clamp-2 my-1">
                                            {item.title}
                                        </h4>
                                        
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                                            <Badge variant="secondary" className='text-xs sm:text-sm capitalize'>{item.type}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-400 fill-yellow-400" />
                                                <span>{item.rating.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                <span>{item.listsCount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs sm:text-sm text-white/90 line-clamp-2 md:line-clamp-3 md:max-w-prose">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="self-start md:self-end mt-2 md:mt-0">
                                      <Button size="sm" className="text-xs sm:text-sm px-4 py-2">
                                          Información
                                      </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 bg-background/50 hover:bg-background/80 border-none text-foreground opacity-0 group-hover/slideshow:opacity-100 transition-opacity" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 bg-background/50 hover:bg-background/80 border-none text-foreground opacity-0 group-hover/slideshow:opacity-100 transition-opacity" />
        </Carousel>
        <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: count }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        current === index ? 'w-4 bg-primary' : 'bg-muted-foreground/50'
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
    </section>
  );
}
