
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

  const breadcrumbs: { href: string; label: React.ReactNode; isLast: boolean }[] = [];

  // Home crumb
  breadcrumbs.push({ href: "/", label: <HomeIcon size={16} />, isLast: false });

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const segmentType = segments[0];

    // Handle static index pages like /anime, /manga
    if (index === 0 && segments.length === 1) {
      breadcrumbs.push({ href: currentPath, label: capitalize(segment.replace(/-/g, " ")), isLast: true });
      return;
    }

    // Handle dynamic pages
    if (index === 1) {
        // Add the category link first
        breadcrumbs.push({ href: `/${segmentType}`, label: capitalize(segmentType.replace(/-/g, " ")), isLast: false });
        
        let finalLabel: React.ReactNode = capitalize(segment.replace(/-/g, " "));

        if (['anime', 'manga', 'manhua', 'manwha', 'novela', 'dougua', 'fan-comic'].includes(segmentType)) {
             const media = getMediaBySlug(segment);
             if (media) finalLabel = media.title;
        } else if (segmentType === 'episode') {
            const episode = getEpisodeById(segment);
            if (episode) {
                const media = getMediaPageData(episode.mediaId, 'anime');
                if (media) {
                     // We need to overwrite the previous breadcrumb to insert the media page
                    breadcrumbs.pop();
                    breadcrumbs.push({ href: `/${media.titleInfo.type.toLowerCase()}`, label: media.titleInfo.type, isLast: false });
                    breadcrumbs.push({ href: `/${media.titleInfo.type.toLowerCase()}/${media.titleInfo.slug}`, label: media.titleInfo.title, isLast: false });
                }
                finalLabel = episode.name;
            }
        } else if (segmentType === 'character') {
            const character = getCharacterBySlug(segment);
            if (character) finalLabel = character.name;
        } else if (segmentType === 'voice-actor') {
            const voiceActor = getVoiceActorBySlug(segment);
            if (voiceActor) finalLabel = voiceActor.name;
        }
        
        if (['episode', 'character', 'voice-actor'].includes(segmentType) && segments.length > 1) {
            // Remove the generic segment (e.g., 'Episode', 'Character')
            breadcrumbs.shift(); // Remove Home
            breadcrumbs.shift(); // Remove the generic segment if it was added
            breadcrumbs.unshift({ href: "/", label: <HomeIcon size={16} />, isLast: false });
        }


        breadcrumbs.push({ href: currentPath, label: finalLabel, isLast: true });
    }
  });
  
  // Filter out any breadcrumbs that were part of the intermediate dynamic routing logic but shouldn't be displayed
  const finalCrumbs = breadcrumbs.filter((crumb, index, self) => {
    // Hide the generic segment link (e.g. /episode, /character) when there's a dynamic page after it
    if (['episode', 'character', 'voice-actor'].includes(String(crumb.label).toLowerCase()) && !crumb.isLast) {
      return false;
    }
    // Remove duplicate labels
    if (index > 0 && crumb.label === self[index-1].label) {
        return false;
    }
    return true;
  });

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {finalCrumbs.map((crumb, index) => (
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
