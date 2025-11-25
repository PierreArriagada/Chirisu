import { Suspense } from 'react';
import { ReportedCommentsTabs } from '@/components/moderation/reported-comments-tabs';

export const metadata = {
  title: 'Comentarios Reportados - Panel de Administración',
  description: 'Gestiona los comentarios reportados por la comunidad',
};

export default function ReportedCommentsPage() {
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
