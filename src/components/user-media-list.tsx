'use client';

import type { TitleInfo } from "@/lib/types";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";

function MediaItem({ item }: { item: TitleInfo }) {
    const url = `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;
    return (
        <Link href={url} className="group">
            <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:shadow-md">
                <div className="flex-shrink-0">
                    <Image
                        src={item.imageUrl}
                        alt={`Cover for ${item.title}`}
                        width={60}
                        height={90}
                        className="rounded-md object-cover aspect-[2/3]"
                        data-ai-hint={item.imageHint}
                    />
                </div>
                <div className="flex flex-col justify-center gap-1 overflow-hidden">
                    <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{item.title}</h4>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary" className='capitalize w-min'>{item.type}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span>{item.rating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}


export default function UserMediaList({ items }: { items: TitleInfo[] }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <p>No hay nada en esta lista todavía.</p>
                <p className="text-sm">¡Empieza a añadir tus títulos favoritos!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
                <MediaItem key={item.id} item={item} />
            ))}
        </div>
    )
}
