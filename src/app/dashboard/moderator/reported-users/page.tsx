'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportedUsersContent } from '@/components/moderation/reported-users-content';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserX } from 'lucide-react';

export default function ReportedUsersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UserX className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Usuarios Reportados</h1>
          <p className="text-muted-foreground">
            Gestiona los reportes de comportamiento inapropiado de usuarios
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="reviewing">En revisión</TabsTrigger>
          <TabsTrigger value="resolved">Resueltos</TabsTrigger>
          <TabsTrigger value="rejected">Desestimados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedUsersContent status="pending" />
          </Suspense>
        </TabsContent>

        <TabsContent value="reviewing">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedUsersContent status="reviewing" />
          </Suspense>
        </TabsContent>

        <TabsContent value="resolved">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedUsersContent status="resolved" />
          </Suspense>
        </TabsContent>

        <TabsContent value="rejected">
          <Suspense fallback={<LoadingSkeleton />}>
            <ReportedUsersContent status="rejected" />
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
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
