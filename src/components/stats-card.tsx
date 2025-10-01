import type { AnimeDetails } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2, CheckCircle, Heart, Star, Users, ListVideo } from "lucide-react";

type StatItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <Card className="p-4 flex flex-col items-center justify-center gap-2 text-center">
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </Card>
  );
}

export default function StatsCard({ stats }: { stats: AnimeDetails['stats'] }) {
  return (
    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatItem icon={<Star size={24} />} label="Puntuación" value={stats.score.toFixed(2)} />
        <StatItem icon={<BarChart2 size={24} />} label="Popularidad" value={`#${stats.popularity}`} />
        <StatItem icon={<Heart size={24} />} label="Favoritos" value={stats.favorites.toLocaleString()} />
        <StatItem icon={<CheckCircle size={24} />} label="Completado" value={stats.completed.toLocaleString()} />
        <StatItem icon={<Users size={24} />} label="Viendo" value={stats.watching.toLocaleString()} />
        <StatItem icon={<ListVideo size={24} />} label="Planeo verlo" value={stats.planToWatch.toLocaleString()} />
    </CardContent>
  );
}
