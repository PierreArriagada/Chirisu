import Link from 'next/link';
import { BookOpen, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { Button } from './ui/button';

export default function Footer() {
  const socialLinks = [
    { name: 'Twitter', icon: <Twitter size={18} />, href: '#' },
    { name: 'Facebook', icon: <Facebook size={18} />, href: '#' },
    { name: 'Instagram', icon: <Instagram size={18} />, href: '#' },
    { name: 'YouTube', icon: <Youtube size={18} />, href: '#' },
  ];

  const navLinks = [
    { name: 'Anime', href: '/anime' },
    { name: 'Manga', href: '/manga' },
    { name: 'Novelas', href: '/novela' },
    { name: 'Manhwa', href: '/manwha' },
  ];

  return (
    <footer className="bg-card/50 border-t mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-4">
              <BookOpen className="w-6 h-6" />
              <span className="text-xl font-headline">Chirisu</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Tu portal central para descubrir, seguir y explorar el vasto mundo del anime, manga, novelas ligeras y más. Sumérgete en información detallada, rankings, y discusiones de la comunidad.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media Section */}
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Chirisu. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Términos y Condiciones
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
