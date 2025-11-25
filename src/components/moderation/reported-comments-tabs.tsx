'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ReportedCommentsContent } from './reported-comments-content';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface ReportCounts {
  pending: number;
  reviewing: number;
  resolved: number;
  rejected: number;
}

export function ReportedCommentsTabs() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ReportCounts>({
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    loadCounts();
    // Refresh counts cada 30 segundos
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.id, user?.isAdmin]);

  const loadCounts = async () => {
    if (!user?.id) return;

    try {
      const statuses = ['pending', 'reviewing', 'resolved', 'rejected'];
      const promises = statuses.map(status =>
        fetch(`/api/admin/reported-comments?status=${status}&currentUserId=${user.id}&isAdmin=${user.isAdmin}&limit=1`)
          .then(res => res.json())
      );

      const results = await Promise.all(promises);
      
      setCounts({
        pending: results[0]?.pagination?.total || 0,
        reviewing: results[1]?.pagination?.total || 0,
        resolved: results[2]?.pagination?.total || 0,
        rejected: results[3]?.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending" className="gap-2">
          Pendientes
          {loadingCounts ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : counts.pending > 0 ? (
            <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
              {counts.pending}
            </Badge>
          ) : null}
        </TabsTrigger>
        
        <TabsTrigger value="reviewing" className="gap-2">
          En Revisión
          {loadingCounts ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : counts.reviewing > 0 ? (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {counts.reviewing}
            </Badge>
          ) : null}
        </TabsTrigger>
        
        <TabsTrigger value="resolved" className="gap-2">
          Resueltos
          {loadingCounts ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : counts.resolved > 0 ? (
            <Badge variant="outline" className="ml-1 px-1.5 py-0 text-xs">
              {counts.resolved}
            </Badge>
          ) : null}
        </TabsTrigger>
        
        <TabsTrigger value="rejected" className="gap-2">
          Descartados
          {loadingCounts ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : counts.rejected > 0 ? (
            <Badge variant="outline" className="ml-1 px-1.5 py-0 text-xs">
              {counts.rejected}
            </Badge>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <ReportedCommentsContent status="pending" onUpdate={loadCounts} />
      </TabsContent>

      <TabsContent value="reviewing">
        <ReportedCommentsContent status="reviewing" onUpdate={loadCounts} />
      </TabsContent>

      <TabsContent value="resolved">
        <ReportedCommentsContent status="resolved" onUpdate={loadCounts} />
      </TabsContent>

      <TabsContent value="rejected">
        <ReportedCommentsContent status="rejected" onUpdate={loadCounts} />
      </TabsContent>
    </Tabs>
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
