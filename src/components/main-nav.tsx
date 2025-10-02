import Link from "next/link";
import { BookOpen, Clapperboard, Film, Menu, Newspaper, Pencil, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { ThemeToggle } from "./theme-toggle";

function MainNav() {
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
    <div className="bg-card/95 backdrop-blur-sm border-b">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between h-16">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                    <BookOpen />
                    <span>AniHub Info</span>
                    </Link>
                </div>
                <div className="hidden md:flex flex-1 max-w-md items-center gap-2">
                    <Input placeholder="Buscar anime, manga..." className="bg-background/50"/>
                    <Button variant="ghost" size="icon">
                        <Search />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
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
        <div className="hidden md:block border-t">
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
