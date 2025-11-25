import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Award, FileText, List, Star } from 'lucide-react';
import { UserAvatar } from '@/components/user';

interface UserStats {
  contributions: number;
  listItems: number;
  reviews: number;
  activityScore: number;
}

interface MediaBreakdown {
  anime: number;
  manga: number;
  novela: number;
  donghua: number;
  manhua: number;
  manhwa: number;
  fanComic: number;
}

interface ActiveUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  points: number;
  stats: UserStats;
  mediaBreakdown: MediaBreakdown;
}

interface TopActiveUsersCardProps {
  users: ActiveUser[];
}

export default function TopActiveUsersCard({ users }: TopActiveUsersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Usuarios Más Activos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user, index) => (
          <div key={user.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-accent/50">
            <span className="text-lg font-bold text-muted-foreground w-6 text-center flex-shrink-0 mt-1">
              {index + 1}
            </span>
            
            <UserAvatar 
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              username={user.username}
              size={48}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  href={`/u/${user.username}`}
                  className="font-semibold text-sm truncate hover:underline hover:text-primary transition-colors"
                >
                  {user.displayName}
                </Link>
                <Badge variant="secondary" className="text-xs">
                  Nv.{user.level}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.stats.contributions > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    <FileText className="h-3 w-3" />
                    <span>{user.stats.contributions} contrib.</span>
                  </div>
                )}
                
                {user.stats.listItems > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    <List className="h-3 w-3" />
                    <span>{user.stats.listItems} items</span>
                  </div>
                )}
                
                {user.stats.reviews > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    <Star className="h-3 w-3" />
                    <span>{user.stats.reviews} reviews</span>
                  </div>
                )}
              </div>

              {user.stats.listItems > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 text-xs text-muted-foreground">
                  {user.mediaBreakdown.anime > 0 && (
                    <span className="opacity-75">A:{user.mediaBreakdown.anime}</span>
                  )}
                  {user.mediaBreakdown.manga > 0 && (
                    <span className="opacity-75">M:{user.mediaBreakdown.manga}</span>
                  )}
                  {user.mediaBreakdown.novela > 0 && (
                    <span className="opacity-75">N:{user.mediaBreakdown.novela}</span>
                  )}
                  {user.mediaBreakdown.donghua > 0 && (
                    <span className="opacity-75">D:{user.mediaBreakdown.donghua}</span>
                  )}
                  {user.mediaBreakdown.manhua > 0 && (
                    <span className="opacity-75">MH:{user.mediaBreakdown.manhua}</span>
                  )}
                  {user.mediaBreakdown.manhwa > 0 && (
                    <span className="opacity-75">MW:{user.mediaBreakdown.manhwa}</span>
                  )}
                  {user.mediaBreakdown.fanComic > 0 && (
                    <span className="opacity-75">FC:{user.mediaBreakdown.fanComic}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay usuarios activos para mostrar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
