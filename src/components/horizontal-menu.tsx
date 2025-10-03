'use client';

import React, { useRef } from "react";
import Link from "next/link";
import { BookOpen, Clapperboard, Film, Newspaper, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const HorizontalMenu = () => {
  const menuRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (menuRef.current) {
      const scrollAmount = direction === "right" ? 200 : -200;
      menuRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const navItems = [
    { href: "/anime", label: "Anime", icon: <Clapperboard /> },
    { href: "/manga", label: "Manga", icon: <BookOpen /> },
    { href: "/dougua", label: "Dougua", icon: <Film /> },
    { href: "/novela", label: "Novelas", icon: <Pencil /> },
    { href: "/fan-comic", label: "Fan Comics", icon: <Newspaper /> },
    { href: "/manhua", label: "Manhua", icon: <BookOpen /> },
    { href: "/manwha", label: "Manwha", icon: <BookOpen /> },
  ];


  return (
    <div className="flex justify-center py-2 bg-card/80">
      <div className="flex items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          onClick={() => scroll("left")}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <ChevronLeft />
        </Button>

        <div
          ref={menuRef}
          className="flex overflow-x-auto space-x-2 px-2 py-1 hide-scrollbar"
        >
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="whitespace-nowrap px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Button
          onClick={() => scroll("right")}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default HorizontalMenu;
