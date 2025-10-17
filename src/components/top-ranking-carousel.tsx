'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { ArrowRight, Bookmark, MessageCircle, Star } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';

interface TopRankingCarouselProps {
  title: string;
  items: TitleInfo[];
  viewMoreLink?: string;
}

export default function TopRankingCarousel({ title, items, viewMoreLink }: TopRankingCarouselProps) {
  if (!items || items.length === 0) {
    return null;
  }
  
  const url = (item: TitleInfo) => `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold font-headline">{title}</h2>
        {viewMoreLink && (
          <Button variant="link" asChild className="text-muted-foreground text-sm">
            <Link href={viewMoreLink}>
              Ver más <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            containScroll: 'trimSnaps',
            slidesToScroll: 1,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {items.map((item, index) => (
              <CarouselItem 
                key={index} 
                className="pl-2 pr-2 basis-[45%] ss:basis-[40%] sm:basis-[33.333%] md:basis-[25%] lg:basis-[20%] xl:basis-[16.666%]"
              >
                <Link href={url(item)} className="block group cursor-pointer h-full">
                  <div className="flex flex-col h-full">
                    <Card className="overflow-hidden border-none shadow-md bg-transparent">
                      <CardContent className="p-0 relative">
                        <div className="relative aspect-[2/3] w-full">
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="transition-transform duration-300 group-hover:scale-105 rounded-md"
                            sizes="(max-width: 320px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                            objectFit="cover"
                            priority={index < 6}
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-md" />
                          
                          <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                              {index + 1}
                            </span>
                          </div>
                          
                          {item.rating > 0 && (
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                              <div className="flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-white px-1 py-0.5 rounded">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400"/>
                                <span className="text-[10px] sm:text-xs font-semibold">{item.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2">
                            <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                              <div className="flex items-center gap-0.5">
                                <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90"/>
                                <span className="text-[10px] sm:text-xs text-white/90 font-medium">
                                  {formatNumber(item.commentsCount)}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Bookmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90"/>
                                <span className="text-[10px] sm:text-xs text-white/90 font-medium">
                                  {formatNumber(item.listsCount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 text-left w-full group-hover:text-primary transition-colors mt-1.5 px-0.5">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
