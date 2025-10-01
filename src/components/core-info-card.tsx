import Image from "next/image";
import { Bookmark, Heart, ListPlus, MessageCircle, TrendingUp, Trophy } from "lucide-react";
import type { TitleInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";

type StatProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-left w-full">
      <div className="text-primary flex-shrink-0">{icon}</div>
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}

export default function CoreInfoCard({ titleInfo }: { titleInfo: TitleInfo }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="flex flex-col ss:flex-row ss:items-start ss:justify-between gap-2">
          <CardTitle className="font-headline text-lg">
            {titleInfo.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col ss:flex-row gap-4">
          <div className="relative flex-shrink-0 ss:w-2/5">
            <Badge variant="outline" className="absolute top-2 right-2 text-sm capitalize bg-background/80 backdrop-blur-sm z-10">{titleInfo.type}</Badge>
            <Image
              src={titleInfo.imageUrl}
              alt={`Cover for ${titleInfo.title}`}
              width={300}
              height={450}
              className="rounded-lg object-cover shadow-lg aspect-[2/3] w-full"
              data-ai-hint={titleInfo.imageHint}
              priority
            />
          </div>
          <div className="flex flex-col justify-start gap-2 ss:w-3/5">
            <Stat icon={<Trophy size={16} />} label="Ranking" value={`#${titleInfo.ranking}`} />
            <Stat icon={<MessageCircle size={16} />} label="Comentarios" value={titleInfo.commentsCount.toLocaleString()} />
            <Stat icon={<Bookmark size={16} />} label="En Listas" value={titleInfo.listsCount.toLocaleString()} />
            <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-left w-full">
               <div className="text-primary flex-shrink-0"><TrendingUp size={16} /></div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-muted-foreground">Puntuación</span>
                <p className="font-bold text-sm">{titleInfo.rating.toFixed(1)}/10</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4">
        <Button size="lg" className="flex-1 text-xs px-2">
          <Heart className="mr-2 h-4 w-4 flex-shrink-0" /> Favoritos
        </Button>
        <Button size="lg" variant="secondary" className="flex-1 text-xs px-2">
          <ListPlus className="mr-2 h-4 w-4 flex-shrink-0" /> Añadir a lista
        </Button>
      </CardFooter>
    </Card>
  );
}
