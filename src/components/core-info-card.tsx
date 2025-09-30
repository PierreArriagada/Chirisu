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
    <div className="flex items-center gap-2 rounded-lg bg-background py-1 text-left w-full">
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
          <CardTitle className="font-headline text-lg ss:text-xl">
            {titleInfo.title}
          </CardTitle>
          <Badge variant="outline" className="text-sm capitalize w-min flex-shrink-0">{titleInfo.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col ss:flex-row gap-4">
          <div className="flex-shrink-0 ss:w-2/5">
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
          <div className="flex flex-col justify-start gap-1 ss:w-3/5">
            <Stat icon={<Trophy size={18} />} label="Ranking" value={`#${titleInfo.ranking}`} />
            <Stat icon={<MessageCircle size={18} />} label="Comments" value={titleInfo.commentsCount.toLocaleString()} />
            <Stat icon={<Bookmark size={18} />} label="In Lists" value={titleInfo.listsCount.toLocaleString()} />
            <div className="flex items-center gap-2 rounded-lg bg-background py-1 text-left w-full">
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-muted-foreground">Rating</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={titleInfo.rating} starSize={14} />
                  <p className="font-bold text-sm">{titleInfo.rating.toFixed(1)}/10</p>
                </div>
              </div>
            </div>
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
