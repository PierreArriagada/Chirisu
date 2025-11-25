import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Breadcrumbs, MainNav, ThemeProvider, Footer } from '@/components/layout';
import { AuthProvider } from '@/context/auth-context';
import { HorizontalMenu } from '@/components/shared';
import { SearchBar } from '@/components/catalog';

export const metadata: Metadata = {
  title: 'Chirisu - Tu Lista de Anime, Manga y Más',
  description: 'Organiza, descubre y comparte tus anime, manga, novelas y más favoritos. Crea listas personalizadas, comenta y conecta con otros fans.',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'system', 'dynamic']}
          >
            <MainNav />
            <SearchBar />
            <HorizontalMenu />
            <Breadcrumbs />
            <main className="px-4 sm:px-6 lg:px-8 min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
