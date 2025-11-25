'use client';

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Clapperboard, Film, Newspaper, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HorizontalMenu = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (menuRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = menuRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const current = menuRef.current;
    if (current) {
      checkScroll();
      current.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        current.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (menuRef.current) {
      const scrollAmount = direction === "right" ? 200 : -200;
      menuRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const navItems = [
    { href: "/anime", label: "Anime", icon: <Clapperboard /> },
    { href: "/manga", label: "Manga", icon: <BookOpen /> },
    { href: "/donghua", label: "Donghua", icon: <Film /> },
    { href: "/novela", label: "Novelas", icon: <Pencil /> },
    { href: "/fan-comic", label: "Fan Comics", icon: <Newspaper /> },
    { href: "/manhua", label: "Manhua", icon: <BookOpen /> },
    { href: "/manhwa", label: "Manhwa", icon: <BookOpen /> },
  ];

  return (
    <div className="flex justify-center py-2 bg-card/80">
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* Flecha izquierda con degradado */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 z-10 flex items-start pl-4 sm:pl-6 lg:pl-8 pt-1">
              <div className="absolute inset-y-0 -left-4 w-24 bg-gradient-to-r from-card/80 via-card/60 to-transparent pointer-events-none" />
              <Button
                onClick={() => scroll("left")}
                variant="ghost"
                size="icon"
                className="h-auto w-auto p-1.5 rounded-md relative z-10 bg-card/90 backdrop-blur-sm hover:bg-card shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Contenedor de items */}
          <div
            ref={menuRef}
            className="flex overflow-x-auto space-x-2 px-2 py-1 hide-scrollbar w-full"
          >
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200 bg-muted/50 text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Flecha derecha con degradado */}
          {showRightArrow && (
            <div className="absolute right-0 top-0 z-10 flex items-start pr-4 sm:pr-6 lg:pr-8 pt-1">
              <div className="absolute inset-y-0 -right-4 w-24 bg-gradient-to-l from-card/80 via-card/60 to-transparent pointer-events-none" />
              <Button
                onClick={() => scroll("right")}
                variant="ghost"
                size="icon"
                className="h-auto w-auto p-1.5 rounded-md relative z-10 bg-card/90 backdrop-blur-sm hover:bg-card shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorizontalMenu;


