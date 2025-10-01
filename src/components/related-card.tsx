import type { RelatedTitle } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";
import Link from "next/link";

export default function RelatedCard({ relatedTitles }: { relatedTitles: RelatedTitle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relacionados</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedTitles.map(item => (
          <Link href={`/${item.type.toLowerCase()}/${item.slug}`} key={item.id} className="group">
            <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
              <Image src={item.imageUrl} alt={item.title} width={300} height={150} className="w-full h-32 object-cover" data-ai-hint={item.imageHint} />
              <div className="p-4 flex flex-col flex-grow">
                <Badge variant="secondary" className="w-min mb-2">{item.type}</Badge>
                <h4 className="font-semibold group-hover:text-primary transition-colors">{item.title}</h4>
              </div>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
