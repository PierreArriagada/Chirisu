import { Suspense } from 'react';
import { ReportedCommentsTabs } from '@/components/moderation/reported-comments-tabs';

export const metadata = {
  title: 'Comentarios Reportados - Panel de Moderación',
  description: 'Gestiona los comentarios reportados por la comunidad',
};

export default function ModeratorReportedCommentsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comentarios Reportados</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y modera los comentarios reportados por la comunidad
        </p>
      </div>

      <ReportedCommentsTabs />
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
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
