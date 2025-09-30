import Image from "next/image";
import { Bookmark, Heart, ListPlus, MessageCircle, Trophy } from "lucide-react";
import type { TitleInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "./star-rating";
import { Badge } from "./ui/badge";

type StatProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-background p-4 shadow-sm transition-transform hover:scale-105">
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

export default function CoreInfoCard({ titleInfo }: { titleInfo: TitleInfo }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle className="font-headline text-3xl md:text-4xl">{titleInfo.title}</CardTitle>
          <Badge variant="outline" className="text-sm capitalize w-min">{titleInfo.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-1 mx-auto">
          <Image
            src={titleInfo.imageUrl}
            alt={`Cover for ${titleInfo.title}`}
            width={300}
            height={450}
            className="rounded-lg object-cover shadow-lg aspect-[2/3]"
            data-ai-hint={titleInfo.imageHint}
            priority
          />
        </div>
        <div className="md:col-span-2 flex flex-col justify-between gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat icon={<Trophy size={24} />} label="Ranking" value={`#${titleInfo.ranking}`} />
            <Stat icon={<MessageCircle size={24} />} label="Comments" value={titleInfo.commentsCount.toLocaleString()} />
            <Stat icon={<Bookmark size={24} />} label="In Lists" value={titleInfo.listsCount.toLocaleString()} />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-background p-4">
            <span className="text-sm font-medium text-muted-foreground">Rating</span>
            <StarRating rating={titleInfo.rating} />
            <p className="font-bold text-lg">{titleInfo.rating.toFixed(1)}/10</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 p-6">
        <Button size="lg" className="w-full sm:w-auto flex-1">
          <Heart className="mr-2 h-4 w-4" /> Add to Favorites
        </Button>
        <Button size="lg" variant="secondary" className="w-full sm:w-auto flex-1">
          <ListPlus className="mr-2 h-4 w-4" /> Add to List
        </Button>
      </CardFooter>
    </Card>
  );
}
