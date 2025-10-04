'use client';

import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const searchVisiblePaths = [
    '/',
    '/anime',
    '/manga',
    '/manhua',
    '/manwha',
    '/novela',
    '/dougua',
    '/fan-comic',
  ];
  const showSearch = searchVisiblePaths.includes(pathname);

  return (
    <div className={cn("w-full pb-4 px-4 sm:px-6 lg:px-8", { "hidden": !showSearch })}>
      <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            name="search"
            placeholder="Buscar anime, manga, manhwa..."
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <Button type="submit" size="default" className="hidden sm:flex">
          Buscar
        </Button>
      </form>
    </div>
  );
}
