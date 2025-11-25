/**
 * @fileoverview LatestPostsCard - Tarjeta para mostrar las últimas publicaciones del foro.
 * 
 * Este componente muestra una lista de las publicaciones más recientes o activas
 * de la comunidad. Cada elemento de la lista es un enlace que lleva al hilo
 * del foro correspondiente y muestra el título del post, su autor y el número
 * de respuestas.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  author: string;
  replies: number;
};

interface LatestPostsCardProps {
  posts: Post[];
}

export default function LatestPostsCard({ posts }: LatestPostsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foro de la comunidad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map(post => (
          <Link href="#" key={post.id} className="block group">
            <div className="p-3 rounded-lg transition-colors group-hover:bg-accent/50">
              <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-accent-foreground">
                {post.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>por @{post.author}</span>
                <div className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  <span>{post.replies}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
