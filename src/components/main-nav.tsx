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
import { BookOpen, Search, User, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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
import HorizontalMenu from "./horizontal-menu";

function MainNav() {
  const { user, logout } = useAuth();
    
  return (
    <div className="bg-card/95 backdrop-blur-sm border-b">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between h-auto min-h-16 flex-wrap py-2 gap-y-2">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                    <BookOpen />
                    <span className="hidden sm:inline">Chirisu</span>
                    </Link>
                </div>
                
                {/* Search in the middle for large screens */}
                <div className="hidden lg:flex flex-1 max-w-md items-center gap-2 mx-4">
                  <Input placeholder="Buscar anime, manga..." className="bg-background/50 border-0 focus-visible:ring-offset-0 focus-visible:ring-transparent"/>
                  <Button variant="ghost" size="icon">
                      <Search />
                  </Button>
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
                </div>

                {/* Search for small/medium screens */}
                <div className="flex lg:hidden w-full items-center gap-2 order-last">
                  <Input placeholder="Buscar anime, manga..." className="bg-background/50 border-0 focus-visible:ring-offset-0 focus-visible:ring-transparent"/>
                  <Button variant="ghost" size="icon">
                      <Search />
                  </Button>
                </div>
            </nav>
        </header>
        <div className="md:border-t">
          <HorizontalMenu />
        </div>
    </div>
  );
}

export default MainNav;
