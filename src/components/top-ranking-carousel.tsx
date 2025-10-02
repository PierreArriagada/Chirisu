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
import { ArrowRight } from 'lucide-react';
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

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
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
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={index} className="basis-1/2 ss:basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
               <Link href={url(item)} className="block group cursor-pointer">
                <Card className="overflow-hidden h-full">
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
                    <div className="absolute top-0 left-1 font-headline font-bold text-4xl text-white/80 mix-blend-difference drop-shadow-lg" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.2)' }}>
                      {item.ranking}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </section>
  );
}
