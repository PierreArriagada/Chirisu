'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { ArrowRight, Bookmark, MessageCircle, Star, Dot } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils';

interface TopRankingCarouselProps {
  title: string;
  items: TitleInfo[];
  viewMoreLink?: string;
}

const DotButton: React.FC<{ selected: boolean; onClick: () => void }> = ({
  selected,
  onClick,
}) => {
  return (
    <button
      className={cn(
        'h-2 w-2 rounded-full transition-all duration-300',
        selected ? 'bg-primary w-4' : 'bg-muted-foreground/50'
      )}
      type="button"
      onClick={onClick}
    />
  );
};

export default function TopRankingCarousel({ title, items, viewMoreLink }: TopRankingCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

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
        setApi={setApi}
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
        <CarouselContent className="pl-4 sm:pl-6 lg:pl-8">
           {items.map((item, index) => (
            <CarouselItem key={index} className="basis-[90%] md:basis-[80%] lg:basis-[70%]">
               <Link href={url(item)} className="block group cursor-pointer h-full">
                <Card className="overflow-hidden h-full relative border-none shadow-xl">
                  {/* Background Image */}
                   <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 scale-110 group-hover:scale-125"
                      data-ai-hint={item.imageHint}
                      priority={index < 2}
                    />
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />
                 
                  <CardContent className="relative p-6 h-full flex flex-col md:flex-row gap-6 items-center text-white">
                      <div className="relative flex-shrink-0 w-2/5 md:w-2/5 h-full">
                         <div className="absolute -top-2 -left-2 bg-primary/80 text-primary-foreground font-bold text-xl rounded-full h-12 w-12 flex items-center justify-center shadow-lg z-10">
                          #{item.ranking}
                        </div>
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={300}
                          height={450}
                          className="object-cover w-full h-auto aspect-[2/3] rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={item.imageHint}
                        />
                      </div>
                      
                      <div className="flex flex-col justify-center gap-3 w-full md:w-3/5">
                        <h3 className="font-headline text-2xl lg:text-3xl font-bold leading-tight line-clamp-2 group-hover:text-primary/90 transition-colors">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
                              <Star className="w-5 h-5 fill-current" />
                              <span>{item.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-80">
                              <MessageCircle className="w-4 h-4" />
                              <span>{formatNumber(item.commentsCount)}</span>
                          </div>
                           <div className="flex items-center gap-1.5 opacity-80">
                              <Bookmark className="w-4 h-4" />
                              <span>{formatNumber(item.listsCount)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm opacity-80 leading-relaxed line-clamp-3 md:line-clamp-4 lg:line-clamp-5">
                          {item.description}
                        </p>
                        
                         <div className="mt-auto pt-4 self-end">
                            <Button variant="secondary" size="lg" className="backdrop-blur-sm bg-white/20 hover:bg-white/30 border-white/30 border">
                                Leer más <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <DotButton key={i} selected={i === current} onClick={() => scrollTo(i)} />
        ))}
      </div>
    </section>
  );
}
