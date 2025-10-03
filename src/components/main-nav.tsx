/**
 * @fileoverview MainNav - Componente de navegación principal de la aplicación.
 * 
 * Este componente renderiza la barra de navegación superior, que es visible en
 * todas las páginas. Incluye:
 * - El logo y título del sitio.
 * - Un campo de búsqueda central (en escritorio).
 * - El menú de categorías de medios (Anime, Manga, etc.).
 * - Un interruptor para cambiar el tema (claro/oscuro/dinámico).
 * - Lógica para mostrar un botón de "Iniciar Sesión" o, si el usuario está
 *   autenticado, un menú de perfil con su avatar, nombre y enlaces a su
 *   perfil y para cerrar sesión.
 * También gestiona la navegación móvil a través de un menú lateral (Sheet).
 */

'use client';

import Link from "next/link";
import { BookOpen, Clapperboard, Film, Menu, Newspaper, Pencil, Search, User, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

function MainNav() {
  const { user, logout } = useAuth();
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
    <div className="bg-card/95 backdrop-blur-sm">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between h-16">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                    <BookOpen />
                    <span className="hidden sm:inline">Chirisu</span>
                    </Link>
                     <div className="hidden md:flex flex-1 max-w-md items-center gap-2">
                        <Input placeholder="Buscar anime, manga..." className="bg-background/50 border-0 focus-visible:ring-offset-0 focus-visible:ring-transparent"/>
                        <Button variant="ghost" size="icon">
                            <Search />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar>
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="outline">
                            <Link href="/login">Iniciar Sesión</Link>
                        </Button>
                    )}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Navegación</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-4 p-4">
                                    {navItems.map(item => (
                                    <Link key={item.href} href={item.href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>
        </header>
        <div className="hidden md:block">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap py-2">
                     {navItems.map(item => (
                        <Link key={item.href} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2">
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

export default MainNav;
