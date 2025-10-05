'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, Clapperboard, Film, Newspaper, Pencil, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const contributionTypes = [
  { href: "/contribution-center/add-anime", label: "Anime", icon: <Clapperboard /> },
  { href: "/contribution-center/add-manga", label: "Manga", icon: <BookOpen /> },
  { href: "/contribution-center/add-dougua", label: "Dougua", icon: <Film /> },
  { href: "/contribution-center/add-novela", label: "Novelas", icon: <Pencil /> },
  { href: "/contribution-center/add-fan-comic", label: "Fan Comics", icon: <Newspaper /> },
  { href: "/contribution-center/add-character", label: "Personaje", icon: <UserPlus /> },
];

export default function AddContributionPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <main className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Acceso Denegado</CardTitle>
                        <CardDescription>Debes iniciar sesión para acceder al Centro de Aportes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/login')}>Ir a Iniciar Sesión</Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto p-4">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Añadir Nuevo Contenido</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        ¡Gracias por ayudar a crecer la comunidad! ¿Qué te gustaría agregar hoy?
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contributionTypes.map((item) => (
                        <Link href={item.href} key={item.href} className="group">
                            <Card className="h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
                                <div className="p-4 bg-primary/10 rounded-full mb-4">
                                    <div className="p-3 bg-primary/20 rounded-full text-primary group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</h3>
                            </Card>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </main>
    );
}
