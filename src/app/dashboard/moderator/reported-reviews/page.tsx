import { Suspense } from 'react';
import { ReportedReviewsContent } from '@/components/moderation/reported-reviews-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Reviews Reportadas - Panel de Moderación',
  description: 'Gestiona las reviews reportadas por la comunidad',
};

export default function ModeratorReportedReviewsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews Reportadas</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y modera las reviews reportadas por la comunidad
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="resolved">Resueltos</TabsTrigger>
          <TabsTrigger value="dismissed">Desestimados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedReviewsContent status="pending" />
          </Suspense>
        </TabsContent>

        <TabsContent value="resolved">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedReviewsContent status="resolved" />
          </Suspense>
        </TabsContent>

        <TabsContent value="dismissed">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedReviewsContent status="dismissed" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
