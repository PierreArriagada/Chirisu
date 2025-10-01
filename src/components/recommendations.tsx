import { recommendSimilarTitles } from '@/ai/flows/recommend-similar-titles';
import type { TitleInfo } from '@/lib/types';
import RecommendationCard from './recommendation-card';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

export default async function Recommendations({ titleInfo }: { titleInfo: TitleInfo }) {
  let recommendations = [];
  try {
    recommendations = await recommendSimilarTitles({
      title: titleInfo.title,
      type: titleInfo.type,
      description: titleInfo.description,
    });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Could not load recommendations at this time.
            </AlertDescription>
        </Alert>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">No recommendations available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {recommendations.slice(0, 5).map((rec, index) => (
            <RecommendationCard key={rec.title} recommendation={rec} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
