"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ChevronRight } from "lucide-react";
import { getMediaBySlug, getEpisodeById, getCharacterBySlug, getVoiceActorBySlug } from "@/lib/db";

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((i) => i);

  // Don't show on the homepage
  if (segments.length === 0) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    let label = capitalize(segment.replace(/-/g, " "));

    // This is where we can get dynamic labels
    if (segments[0] === 'anime' || segments[0] === 'manga' || segments[0] === 'manhua' || segments[0] === 'manwha' || segments[0] === 'novela' || segments[0] === 'dougua' || segments[0] === 'fan-comic') {
        if(index === 1) {
            const media = getMediaBySlug(segment);
            if(media) label = media.title;
        }
    } else if(segments[0] === 'episode' && index === 1) {
        const episode = getEpisodeById(segment);
        if(episode) label = episode.name;
    } else if(segments[0] === 'character' && index === 1) {
        const character = getCharacterBySlug(segment);
        if(character) label = character.name;
    } else if(segments[0] === 'voice-actor' && index === 1) {
        const voiceActor = getVoiceActorBySlug(segment);
        if(voiceActor) label = voiceActor.name;
    }

    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  // Prepend Home
  breadcrumbs.unshift({ href: "/", label: <HomeIcon size={16} />, isLast: false });

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight size={16} />}
            {crumb.isLast ? (
              <span className="font-semibold text-foreground truncate max-w-48 sm:max-w-96">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary transition-colors">
                <span className="truncate max-w-48 sm:max-w-96">{crumb.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
