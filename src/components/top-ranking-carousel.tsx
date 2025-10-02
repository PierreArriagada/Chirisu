'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { ArrowRight, Bookmark, MessageCircle, Star } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

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
    <section>
      <div className="flex items-center justify-between mb-4 container px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {viewMoreLink && (
          <Button variant="outline" asChild>
            <Link href={viewMoreLink}>
              Ver más <ArrowRight className="ml-2" />
            </Link>
          </Button>
        )}
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="pl-4 sm:pl-6 lg:pl-8">
          {items.map((item, index) => (
            <CarouselItem key={index} className="basis-1/2 ss:basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/7 2xl:basis-1/8">
               <Link href={url(item)} className="block group cursor-pointer h-full">
                <div className="flex flex-col h-full gap-2">
                  <Card className="overflow-hidden h-full flex-grow">
                    <CardContent className="p-0 relative">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={200}
                        height={300}
                        className="object-cover w-full h-auto aspect-[2/3] group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={item.imageHint}
                        priority={index < 5}
                      />
                      {/* Rating */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white p-1 rounded-md text-xs font-bold">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                      
                       {/* Bottom Stats */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex justify-between text-white text-xs">
                              <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{formatNumber(item.commentsCount)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <Bookmark className="w-3 h-3" />
                                  <span>{formatNumber(item.listsCount)}</span>
                              </div>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                   <div className="px-1">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.title}</h3>
                   </div>
                 </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
            <CarouselPrevious className="absolute left-4" />
            <CarouselNext className="absolute right-4" />
        </div>
      </Carousel>
    </section>
  );
}
