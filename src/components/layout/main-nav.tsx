'use client';

import Link from "next/link";
import { User, LogOut, PlusCircle, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsButton } from "@/components/user";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function MainNav() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        {/* Logo a la izquierda */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6">
            <rect x="12" y="10" width="40" height="48" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="3"/>
            <path d="M24 10V6C24 4.89543 24.8954 4 26 4H38C39.1046 4 40 4.89543 40 6V10" stroke="currentColor" strokeWidth="3" fill="none"/>
            <rect x="28" y="4" width="8" height="3" rx="1.5" fill="currentColor"/>
            <path d="M20 20L20 28L26 24Z" fill="#00A8F3"/>
            <path d="M30 24H44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M20 32H26V40H20V32Z" fill="#F3A000"/>
            <path d="M26 32L27 33V41L26 40" fill="#D48800"/>
            <path d="M30 36H44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="20" y="44" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M30 48H44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="hidden sm:inline">Chirisu</span>
        </Link>

        {/* Acciones a la derecha */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationsButton />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src={user.image || undefined} alt={user.name || user.username} />
                    <AvatarFallback>{user.name?.[0] || user.username?.[0]}</AvatarFallback>
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
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/contribution-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Centro de Aportes</span>
                    </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                {(isAdmin || isModerator) && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                             {isModerator && (
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/moderator">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        <span>Moderar</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {isAdmin && (
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/admin">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Admin Dashboard</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default MainNav;
