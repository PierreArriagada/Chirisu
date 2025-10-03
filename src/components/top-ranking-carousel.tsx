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
import Image from 'next/image';
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
    <section className="w-full">
      <div className="container mx-auto flex items-baseline justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold font-headline">{title}</h2>
        {viewMoreLink && (
          <Button variant="link" asChild className="text-muted-foreground text-sm">
            <Link href={viewMoreLink}>
              Ver más <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </Button>
        )}
      </div>
      
      <Carousel
        opts={{
          align: 'start',
          loop: true,
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
        <CarouselContent className="-ml-4">
          {items.map((item, index) => (
            <CarouselItem 
              key={index} 
              className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-[12.5%]"
            >
              <div className="flex flex-col h-full">
                <Link href={url(item)} className="block group cursor-pointer">
                  <Card className="overflow-hidden border-none shadow-md bg-transparent">
                    <CardContent className="p-0 relative">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-md"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                          data-ai-hint={item.imageHint}
                          priority={index < 8}
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-md" />
                        
                        <div className="absolute top-1 left-1">
                          <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {index + 1}
                          </span>
                        </div>
                        
                        <div className="absolute top-1 right-1">
                          <div className="flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-white px-1 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400"/>
                            <span className="text-[10px] sm:text-xs font-semibold">{item.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <MessageCircle className="w-3 h-3 text-white/90"/>
                            <span className="text-xs text-white/90 font-medium">
                                {formatNumber(item.commentsCount)}
                            </span>
                        </div>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <Bookmark className="w-3 h-3 text-white/90"/>
                            <span className="text-xs text-white/90 font-medium">
                                {formatNumber(item.listsCount)}
                            </span>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 w-full group-hover:text-primary transition-colors mt-2">
                  {item.title}
                </h3>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
