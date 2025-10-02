import { getEpisodeById, getMediaPageData } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Link as LinkIcon, MessageCircle, Monitor, Tv, UserCircle } from "lucide-react";
import Link from "next/link";


type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const episode = getEpisodeById(params.id);
    if (!episode) {
        return { title: 'Episode not found' }
    }
    
    const media = getMediaPageData(episode.mediaId, 'anime');

    return {
        title: `${episode.name} - ${media?.titleInfo.title} | Chirisu`,
        description: `Information and comments for ${episode.name}.`
    }
}

function WatchLink({ icon, text, href }: { icon: React.ReactNode, text: string, href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full justify-start">
                {icon}
                <span>{text}</span>
            </Button>
        </a>
    )
}


export default function EpisodePage({ params }: Props) {
    const episode = getEpisodeById(params.id);

    if (!episode) {
        notFound();
    }
    
    const media = getMediaPageData(episode.mediaId, 'anime');

    return (
        <main className="container mx-auto p-4 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Video Player Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{episode.name}</CardTitle>
                             <div className="flex items-center text-sm text-muted-foreground gap-4 pt-1">
                                {episode.releaseDate && (
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>{new Date(episode.releaseDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{episode.duration}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-video w-full">
                                <Image src={episode.imageUrl} alt={episode.name} fill className="rounded-lg object-cover" data-ai-hint={episode.imageHint} />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                     <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/50 transition-colors">
                                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle />
                                <span>Comentarios ({episode.comments.toLocaleString()})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                 <UserCircle className="h-10 w-10 text-muted-foreground" />
                                <div className="flex-1 border rounded-lg p-3">
                                    <p className="font-semibold text-sm">@BestFanEver</p>
                                    <p className="text-sm text-muted-foreground">This episode was absolutely fire! The animation peak.</p>
                                </div>
                            </div>
                             <div className="flex gap-3">
                                 <UserCircle className="h-10 w-10 text-muted-foreground" />
                                <div className="flex-1 border rounded-lg p-3">
                                    <p className="font-semibold text-sm">@CriticEye</p>
                                    <p className="text-sm text-muted-foreground">Great adaptation, they nailed the tension from the manga.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-8">
                     {/* Watch On Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ver en</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           <WatchLink icon={<Tv />} text="Simulcast en TV" href="#" />
                           <WatchLink icon={<Monitor />} text="Sitio Oficial" href="#" />
                           <WatchLink icon={<LinkIcon />} text="Crunchyroll" href="#" />
                        </CardContent>
                    </Card>

                    {/* Media Info Card */}
                    {media && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Del anime</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/anime/${media.titleInfo.slug}`} className="group">
                                    <div className="flex items-center gap-4">
                                        <Image src={media.titleInfo.imageUrl} alt={media.titleInfo.title} width={80} height={120} className="rounded-md object-cover aspect-[2/3]" data-ai-hint={media.titleInfo.imageHint} />
                                        <div className="overflow-hidden">
                                            <h3 className="font-semibold group-hover:text-primary transition-colors">{media.titleInfo.title}</h3>
                                            <Badge variant="secondary" className="mt-1">{media.titleInfo.type}</Badge>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </main>
    )
}
