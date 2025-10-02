import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import Breadcrumbs from '@/components/breadcrumbs';
import MainNav from '@/components/main-nav';

export const metadata: Metadata = {
  title: 'AniHub Info',
  description: 'Detailed information about your favorite anime, manga, and novels.',
};

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
        <MainNav />
        <Breadcrumbs />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
