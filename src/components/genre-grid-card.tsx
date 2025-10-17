'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { TitleInfo, MediaType } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

interface GenreGridCardProps {
    categories: string[];
    mediaType: MediaType;
}

export default function GenreGridCard({ categories, mediaType }: GenreGridCardProps) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TitleInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 390);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar datos cuando cambia el género seleccionado
  useEffect(() => {
    loadGenreData();
  }, [selectedCategory, mediaType]);

  const loadGenreData = async () => {
    setLoading(true);
    try {
      const genreName = categories[selectedCategory];
      
      // Mapear MediaType a tipo de API
      const typeMap: Record<MediaType, string> = {
        'Anime': 'anime',
        'Manga': 'manga',
        'Novela': 'novel',
        'Dougua': 'anime',
        'Manhua': 'manga',
        'Manwha': 'manga',
        'Fan Comic': 'manga',
      };
      
      const apiType = typeMap[mediaType] || 'anime';
      
      console.log(`🔍 Cargando ${genreName} para ${mediaType} (API type: ${apiType})`);
      
      const response = await fetch(`/api/media-by-genre?genreName=${encodeURIComponent(genreName)}&mediaType=${apiType}&limit=20`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`✅ Género ${genreName}: ${data.data.length} items`);
        const genreItems: TitleInfo[] = data.data.map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          type: mediaType,
          description: '',
          imageUrl: item.coverImage,
          imageHint: item.title,
          rating: item.averageScore || 0,
          ranking: 0,
          commentsCount: 0,
          listsCount: 0,
        }));
        setItems(genreItems);
      } else {
        console.warn(`⚠️ No hay datos para género ${genreName}`);
        setItems([]);
      }
    } catch (error) {
      console.error('Error cargando datos de género:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const displayCount = showAll ? (isMobile ? 12 : 16) : (isMobile ? 9 : 12);
  const displayedItems = items.slice(0, displayCount);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
        checkScroll();
        scrollElement.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            if(scrollElement) {
                scrollElement.removeEventListener('scroll', checkScroll);
            }
            window.removeEventListener('resize', checkScroll);
        };
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Navigation Menu */}
        <div className="relative border-b">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background p-1 rounded-full shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div
            ref={scrollRef}
            className="flex overflow-x-auto hide-scrollbar px-4 pt-4"
          >
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(index)}
                className="flex-shrink-0 px-4 pb-3 relative whitespace-nowrap"
              >
                <span className={`text-sm font-medium ${
                  selectedCategory === index ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {category}
                </span>
                {selectedCategory === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background p-1 rounded-full shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Image Grid */}
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : displayedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-3 min-[390px]:grid-cols-4 gap-2">
                {displayedItems.map((item) => (
                    <Link href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} key={item.id} className="group flex flex-col">
                        <div className="aspect-[2/3] bg-muted rounded overflow-hidden">
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={200}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            data-ai-hint={item.imageHint}
                        />
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-1 text-center line-clamp-2 h-8">
                          {item.title}
                        </p>
                    </Link>
                ))}
              </div>

              {/* Show More Button */}
              {!showAll && items.length > displayCount && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded transition-colors"
                >
                  Mostrar más
                </button>
              )}
            </>
          ) : (
            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
              No hay {categories[selectedCategory]} disponibles en este momento
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
