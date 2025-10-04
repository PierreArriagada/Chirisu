/**
 * @fileoverview TopRankingSlideshow - A full-width, auto-playing slideshow for category pages.
 * 
 * This component is designed to be a prominent feature at the top of category pages
 * like /anime, /manga, etc. It displays a visually striking, auto-playing carousel
 * of the top 5 daily ranked items. Each slide features a large background image
 * with the title, ranking, and other information overlaid.
 */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { Star, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TopRankingSlideshowProps {
  items: TitleInfo[];
}

export default function TopRankingSlideshow({ items }: TopRankingSlideshowProps) {
  if (!items || items.length === 0) {
    return null;
  }
  
  const url = (item: TitleInfo) => `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;

  return (
    <section className="w-full relative">
        <h2 className="text-2xl font-bold font-headline mb-4">Top Diario</h2>
        <Carousel
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
                            <CardContent className="p-0 relative aspect-[3/4] md:aspect-[2.5/1]">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    data-ai-hint={item.imageHint}
                                    priority={index < 2}
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white w-full md:w-2/3 lg:w-1/2">
                                    <h3 className="text-3xl md:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                                        #{index + 1}
                                    </h3>
                                    <h4 className="text-xl md:text-3xl font-bold group-hover:text-primary-foreground/80 transition-colors line-clamp-2 my-2">
                                        {item.title}
                                    </h4>
                                    
                                    <div className="flex items-center gap-4 text-sm mt-2">
                                        <Badge variant="secondary" className='capitalize'>{item.type}</Badge>
                                        <div className="flex items-center gap-1">
                                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                            <span>{item.rating.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye size={16} />
                                            <span>{item.listsCount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm text-white/80 line-clamp-2 md:line-clamp-3">
                                        {item.description}
                                    </p>
                                    <Button size="sm" className='mt-4 md:absolute md:bottom-8 md:right-8'>
                                        Información
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    </section>
  );
}
