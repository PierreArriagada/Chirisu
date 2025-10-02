"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ChevronRight } from "lucide-react";
import { getMediaBySlug, getEpisodeById, getCharacterBySlug, getVoiceActorBySlug, getMediaPageData } from "@/lib/db";

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((i) => i);

  // Don't show on the homepage
  if (segments.length === 0) {
    return null;
  }

  const breadcrumbs = segments.flatMap((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    let label: string | React.ReactNode = capitalize(segment.replace(/-/g, " "));
    const isLast = index === segments.length - 1;
    let breadcrumbObject = { href, label, isLast };
    let additionalCrumbs: { href: string, label: string, isLast: boolean }[] = [];

    // This is where we can get dynamic labels
    const currentSegmentType = segments[0];
    const isDynamicSegment = index === 1;

    if (isDynamicSegment) {
        if (['anime', 'manga', 'manhua', 'manwha', 'novela', 'dougua', 'fan-comic'].includes(currentSegmentType)) {
            const media = getMediaBySlug(segment);
            if(media) label = media.title;
        } else if (currentSegmentType === 'episode') {
            const episode = getEpisodeById(segment);
            if(episode) {
                const media = getMediaPageData(episode.mediaId, 'anime');
                if (media) {
                    // We need to inject the anime page into the breadcrumbs
                    additionalCrumbs.push({
                        href: `/${media.titleInfo.type.toLowerCase()}/${media.titleInfo.slug}`,
                        label: media.titleInfo.title,
                        isLast: false,
                    });
                }
                label = episode.name;
            }
        } else if (currentSegmentType === 'character') {
            const character = getCharacterBySlug(segment);
            if(character) label = character.name;
        } else if (currentSegmentType === 'voice-actor') {
            const voiceActor = getVoiceActorBySlug(segment);
            if(voiceActor) label = voiceActor.name;
        }
    }
    
    breadcrumbObject.label = label;

    // Hide the generic segment link (e.g. /episode, /character)
    if (['episode', 'character', 'voice-actor'].includes(currentSegmentType) && index === 0) {
        return [];
    }

    if(additionalCrumbs.length > 0) {
        return [...additionalCrumbs, breadcrumbObject];
    }

    return [breadcrumbObject];
  });

  // Prepend Home
  breadcrumbs.unshift({ href: "/", label: <HomeIcon size={16} />, isLast: false });

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href + index} className="flex items-center space-x-2">
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
