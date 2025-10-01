import type { AnimeDetails } from "@/lib/types";
import { CardContent } from "@/components/ui/card";
import { BarChart2, CheckCircle, Heart, Star, Users, ListVideo } from "lucide-react";

type StatItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg p-4 transition-colors hover:bg-muted/50">
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

export default function StatsCard({ stats }: { stats: AnimeDetails['stats'] }) {
  return (
    <CardContent className="grid grid-cols-3 gap-4">
        <StatItem icon={<Star size={24} />} label="Puntuación" value={stats.score.toFixed(2)} />
        <StatItem icon={<BarChart2 size={24} />} label="Popularidad" value={`#${stats.popularity}`} />
        <StatItem icon={<Heart size={24} />} label="Favoritos" value={stats.favorites.toLocaleString()} />
        <StatItem icon={<CheckCircle size={24} />} label="Completado" value={stats.completed.toLocaleString()} />
        <StatItem icon={<Users size={24} />} label="Viendo" value={stats.watching.toLocaleString()} />
        <StatItem icon={<ListVideo size={24} />} label="Planeo verlo" value={stats.planToWatch.toLocaleString()} />
    </CardContent>
  );
}
