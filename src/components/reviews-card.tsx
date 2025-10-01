import type { Review } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import StarRating from "./star-rating";

export default function ReviewsCard({ reviews }: { reviews: Review[] }) {
  return (
    <CardContent className="space-y-6">
      {reviews.map(review => (
        <Card key={review.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4">
                <Image src={review.user.imageUrl} alt={review.user.name} width={40} height={40} className="rounded-full" data-ai-hint={review.user.imageHint} />
                <div>
                    <h4 className="font-semibold">{review.user.name}</h4>
                    <StarRating rating={review.rating} maxStars={10} starSize={16} />
                </div>
            </CardHeader>
            <CardContent>
                <h5 className="font-semibold mb-2">{review.title}</h5>
                <p className="text-sm text-muted-foreground line-clamp-4">{review.review}</p>
            </CardContent>
        </Card>
      ))}
    </CardContent>
  );
}
