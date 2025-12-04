'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, Clapperboard, Film, Newspaper, Pencil, UserPlus, Users, Mic, Building, Tag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScanRequestCard } from "@/components/contributions/scan-request-card";

const contributionCategories = [
  {
    category: "Medios",
    description: "Añade nuevos animes, mangas, novelas, etc.",
    items: [
      { href: "/contribution-center/add-anime", label: "Anime", icon: <Clapperboard />, description: "Series y películas de animación japonesa" },
      { href: "/contribution-center/add-manga", label: "Manga", icon: <BookOpen />, description: "Cómics japoneses" },
      { href: "/contribution-center/add-dougua", label: "Donghua", icon: <Film />, description: "Animación china" },
      { href: "/contribution-center/add-novela", label: "Novelas", icon: <Pencil />, description: "Light novels y novelas web" },
      { href: "/contribution-center/add-manhua", label: "Manhua", icon: <BookOpen />, description: "Cómics chinos" },
      { href: "/contribution-center/add-manhwa", label: "Manhwa", icon: <BookOpen />, description: "Cómics coreanos" },
      { href: "/contribution-center/add-fan-comic", label: "Fan Comics", icon: <Newspaper />, description: "Doujinshi y cómics de fans" },
    ]
  },
  {
    category: "Entidades",
    description: "Añade personajes, staff, estudios, etc.",
    items: [
      { href: "/contribution-center/add-character", label: "Personaje", icon: <Users />, description: "Personajes de anime, manga, etc." },
      { href: "/contribution-center/add-staff", label: "Staff", icon: <UserPlus />, description: "Directores, productores, animadores, etc." },
      { href: "/contribution-center/add-voice-actor", label: "Actor de Voz", icon: <Mic />, description: "Seiyuus y actores de doblaje" },
      { href: "/contribution-center/add-studio", label: "Estudio", icon: <Building />, description: "Estudios de animación y producción" },
      { href: "/contribution-center/add-genre", label: "Género", icon: <Tag />, description: "Géneros y categorías" },
    ]
  }
];

export default function ContributionCenterPage() {
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Centro de Contribuciones</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        ¡Gracias por ayudar a crecer la comunidad! Añade nuevos medios, personajes, staff y más.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Card especial para solicitar rol de Scanlator */}
                    <div className="mb-8">
                        <ScanRequestCard />
                    </div>

                    {contributionCategories.map((category) => (
                        <div key={category.category}>
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">{category.category}</h2>
                                <p className="text-muted-foreground">{category.description}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.items.map((item) => (
                                    <Link href={item.href} key={item.href} className="group">
                                        <Card className="h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
                                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                                                <div className="text-primary group-hover:scale-110 transition-transform">
                                                    {item.icon}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</h3>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                                            )}
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </main>
    );
}
