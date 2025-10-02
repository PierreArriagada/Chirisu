/**
 * @fileoverview TopRankingCarousel - Un carrusel horizontal para mostrar rankings.
 * 
 * Este componente renderiza una lista de títulos en un carrusel con auto-desplazamiento
 * horizontal. Cada item muestra su posición en el ranking, imagen, calificación,
 * y estadísticas de interacción. Es utilizado en la página principal para destacar
 * los títulos más populares de cada categoría.
 */
'use client';

import React, { useEffect, useRef } from 'react';
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

  // Auto-scroll functionality
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollInterval: NodeJS.Timeout;
    let isHovering = false;

    const startScrolling = () => {
        if (isHovering) return;
        scrollInterval = setInterval(() => {
            if (scrollContainer) {
                if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth -1) {
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft += 1;
                }
            }
        }, 30);
    };

    const stopScrolling = () => {
        clearInterval(scrollInterval);
    };

    scrollContainer.addEventListener('mouseenter', () => {
        isHovering = true;
        stopScrolling();
    });
    scrollContainer.addEventListener('mouseleave', () => {
        isHovering = false;
        startScrolling();
    });

    startScrolling();

    return () => clearInterval(scrollInterval);
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
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 text-center sm:text-left font-headline">
        {title}
      </h2>
      
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
        >
          {items.map((item, index) => (
            <Link href={url(item)} key={item.id} className="block flex-shrink-0 relative group cursor-pointer">
              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg">
                {index + 1}
              </div>
              
              <div className="relative w-32 sm:w-36 md:w-40 lg:w-44 h-44 sm:h-48 md:h-52 lg:h-56 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 bg-card">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={item.imageHint}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</h3>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-medium">{item.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Bookmark className="w-3 h-3 text-blue-400 fill-blue-400" />
                        <span className="text-white text-xs">{formatNumber(item.listsCount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3 text-green-400 fill-green-400" />
                        <span className="text-white text-xs">{formatNumber(item.commentsCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
