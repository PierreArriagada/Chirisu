'use client';

/**
 * @fileoverview Footer - Pie de página del sitio
 * 
 * Muestra:
 * - Logo y descripción de Chirisu
 * - Enlaces rápidos (Inicio, Explorar, Listas, etc.)
 * - Enlaces legales (Términos, Privacidad, etc.)
 * - Redes sociales
 * - Copyright
 */

import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Github,
  Heart,
  Mail
} from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Columna 1: Sobre Chirisu */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="10" width="40" height="48" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
                <path d="M24 10V6C24 4.89543 24.8954 4 26 4H38C39.1046 4 40 4.89543 40 6V10" stroke="currentColor" strokeWidth="2"/>
                <rect x="28" y="4" width="8" height="3" rx="1.5" fill="currentColor"/>
                <path d="M20 20L20 28L26 24Z" fill="#00A8F3"/>
                <path d="M30 24H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 32H26V40H20V32Z" fill="#F3A000"/>
                <path d="M30 36H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="20" y="44" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M30 48H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3 className="text-xl font-bold">Chirisu</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu plataforma definitiva para organizar, descubrir y compartir anime, manga, novelas y más. 
              Crea listas personalizadas y conecta con otros fans.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>para la comunidad otaku</span>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/anime" className="text-muted-foreground hover:text-primary transition-colors">
                  Anime
                </Link>
              </li>
              <li>
                <Link href="/manga" className="text-muted-foreground hover:text-primary transition-colors">
                  Manga
                </Link>
              </li>
              <li>
                <Link href="/novela" className="text-muted-foreground hover:text-primary transition-colors">
                  Novelas
                </Link>
              </li>
              <li>
                <Link href="/manhua" className="text-muted-foreground hover:text-primary transition-colors">
                  Manhua
                </Link>
              </li>
              <li>
                <Link href="/manhwa" className="text-muted-foreground hover:text-primary transition-colors">
                  Manhwa
                </Link>
              </li>
              <li>
                <Link href="/dougua" className="text-muted-foreground hover:text-primary transition-colors">
                  Donghua
                </Link>
              </li>
              <li>
                <Link href="/fan-comic" className="text-muted-foreground hover:text-primary transition-colors">
                  Fan Comics
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Comunidad y Ayuda */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide">Comunidad</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">
                  Buscar
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                  Mi Perfil
                </Link>
              </li>
              <li>
                <Link href="/contribution-center" className="text-muted-foreground hover:text-primary transition-colors">
                  Centro de Contribución
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-muted-foreground hover:text-primary transition-colors">
                  Guías de Comunidad
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal y Redes */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-muted-foreground hover:text-primary transition-colors">
                  DMCA / Copyright
                </Link>
              </li>
            </ul>

            {/* Redes Sociales */}
            <div className="pt-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide mb-3">Síguenos</h4>
              <div className="flex gap-3">
                <a
                  href="https://twitter.com/chirisu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/chirisu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/chirisu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://youtube.com/chirisu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href="https://github.com/chirisu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} Chirisu. Todos los derechos reservados.
            </p>
            <p className="text-xs">
              Chirisu no aloja ningún contenido. Toda la información es provista por la comunidad y fuentes públicas.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
