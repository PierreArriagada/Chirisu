'use client';

import { useEffect, useState } from 'react';
import { ReportedReviewsContent } from '@/components/moderation/reported-reviews-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Search, CheckCircle, XCircle } from 'lucide-react';

interface TabCounts {
  pending: number;
  reviewing: number;
  resolved: number;
  rejected: number;
}

export default function AdminReportedReviewsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [counts, setCounts] = useState<TabCounts>({
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCounts = async () => {
    try {
      const statuses = ['pending', 'reviewing', 'resolved', 'rejected'];
      const results = await Promise.all(
        statuses.map(async (status) => {
          const res = await fetch(`/api/moderation/reported-reviews?status=${status}&limit=1`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            return { status, count: data.total || 0 };
          }
          return { status, count: 0 };
        })
      );

      const newCounts = results.reduce((acc, { status, count }) => {
        acc[status as keyof TabCounts] = count;
        return acc;
      }, { pending: 0, reviewing: 0, resolved: 0, rejected: 0 });

      setCounts(newCounts);
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews Reportadas</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y modera las reviews reportadas por la comunidad
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes ({loadingCounts ? '...' : counts.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewing" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            En Revisión ({loadingCounts ? '...' : counts.reviewing})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Resueltos ({loadingCounts ? '...' : counts.resolved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rechazados ({loadingCounts ? '...' : counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReportedReviewsContent status="pending" />
        </TabsContent>

        <TabsContent value="reviewing">
          <ReportedReviewsContent status="reviewing" />
        </TabsContent>

        <TabsContent value="resolved">
          <ReportedReviewsContent status="resolved" />
        </TabsContent>

        <TabsContent value="rejected">
          <ReportedReviewsContent status="rejected" />
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
