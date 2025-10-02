import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import Link from 'next/link';
import { BookOpen, Clapperboard, HomeIcon } from 'lucide-react';
import Breadcrumbs from '@/components/breadcrumbs';

export const metadata: Metadata = {
  title: 'AniHub Info',
  description: 'Detailed information about your favorite anime, manga, and novels.',
};

function NavBar() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
              <BookOpen />
              <span>AniHub Info</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              <HomeIcon />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NavBar />
        <Breadcrumbs />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
