'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Star, Bookmark, MessageCircle } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface TopRankingCarouselProps {
  title: string;
  items: TitleInfo[];
  viewMoreLink: string;
}

const TopRankingCarousel = ({ title, items, viewMoreLink }: TopRankingCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Auto-scroll functionality
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let isInteracting = false;

    const startScrolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        if (isInteracting || !scrollContainer) return;
        
        const firstItem = scrollContainer.children[0] as HTMLElement;
        if (!firstItem) return;
        const itemWidth = firstItem.offsetWidth;
        const gap = parseInt(window.getComputedStyle(scrollContainer).gap || '16px');
        const scrollAmount = (itemWidth + gap) * 2;

        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

        if (scrollContainer.scrollLeft >= maxScroll - 5) {
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 4000);
    };

    const stopScrolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const initialTimeout = setTimeout(startScrolling, 2000);

    const handleInteractionStart = () => { isInteracting = true; stopScrolling(); };
    const handleInteractionEnd = () => { isInteracting = false; startScrolling(); };

    const handleScroll = () => {
        stopScrolling();
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            if (!isInteracting) {
                startScrolling();
            }
        }, 3000); // 3-second delay after manual scroll
    };


    scrollContainer.addEventListener('mouseenter', handleInteractionStart);
    scrollContainer.addEventListener('mouseleave', handleInteractionEnd);
    scrollContainer.addEventListener('touchstart', handleInteractionStart, { passive: true });
    scrollContainer.addEventListener('touchend', handleInteractionEnd);
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(initialTimeout);
      stopScrolling();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollContainer.removeEventListener('mouseenter', handleInteractionStart);
      scrollContainer.removeEventListener('mouseleave', handleInteractionEnd);
      scrollContainer.removeEventListener('touchstart', handleInteractionStart);
      scrollContainer.removeEventListener('touchend', handleInteractionEnd);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  
  const url = (item: TitleInfo) => `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;

  return (
    <div className="w-full px-4 py-6 min-w-[340px]">
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 font-headline text-left">
        {title}
      </h2>
      
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
        >
          {items.map((item) => (
            <Link href={url(item)} key={item.id} className="block flex-shrink-0 w-24 ss:w-28 sm:w-36 md:w-40 lg:w-44 group cursor-pointer">
              <div className="relative w-full h-36 ss:h-40 sm:h-48 md:h-52 lg:h-56 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 bg-card">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={item.imageHint}
                />
                
                {/* Ranking Number */}
                <div className="absolute top-0 left-1 font-headline font-bold text-5xl text-white/80 mix-blend-difference drop-shadow-lg" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.2)' }}>
                  {item.ranking}
                </div>

                {/* Rating (Top Right) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold">{item.rating.toFixed(1)}</span>
                </div>
                
                {/* Bottom Stats Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end justify-end">
                  <div className="flex items-center gap-3 text-white text-xs">
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3" />
                      <span>{formatNumber(item.listsCount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{formatNumber(item.commentsCount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                 <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <Link href={viewMoreLink} className="flex items-center justify-center mt-6 group w-fit mx-auto">
        <span className="text-blue-600 font-medium text-sm sm:text-base border-b-2 border-blue-600 group-hover:border-blue-800 transition-colors duration-300">
          Ver más
        </span>
        <ChevronRight className="w-4 h-4 ml-2 text-blue-600 group-hover:text-blue-800 group-hover:translate-x-1 transition-all duration-300" />
      </Link>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TopRankingCarousel;
