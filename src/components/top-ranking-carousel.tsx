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
    <section>
      <div className="flex items-baseline justify-between mb-4 container px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {viewMoreLink && (
          <Button variant="link" asChild className="text-muted-foreground">
            <Link href={viewMoreLink}>
              Ver más <ArrowRight className="ml-2" />
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
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 pl-4 sm:pl-6 lg:pl-8">
           {items.map((item, index) => (
            <CarouselItem key={index} className="basis-[60%] ss:basis-[45%] sm:basis-[40%] md:basis-[30%] lg:basis-[22%] pl-2">
               <Link href={url(item)} className="block group cursor-pointer h-full">
                <Card className="overflow-hidden h-full flex flex-col border-none shadow-lg bg-transparent">
                  <CardContent className="p-0 relative flex-grow">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={300}
                      height={450}
                      className="object-cover w-full h-full aspect-[2/3] transition-transform duration-300 group-hover:scale-105 rounded-lg"
                      data-ai-hint={item.imageHint}
                      priority={index < 5}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg" />
                     <div className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 bg-black/60 text-white text-base font-bold rounded-full">
                        {index + 1}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs font-bold p-1 rounded-md">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
                        <span>{item.rating.toFixed(1)}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs px-1">
                        <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3"/>
                            <span>{formatNumber(item.commentsCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bookmark className="w-3 h-3"/>
                            <span>{formatNumber(item.listsCount)}</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
                 <h3 className="font-semibold text-sm leading-tight truncate text-left w-full group-hover:text-primary transition-colors mt-2 px-1">
                    {item.title}
                </h3>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
