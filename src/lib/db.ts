import type { AnimeDetails, TitleInfo, OfficialLinks, Character, Episode, Review, RelatedTitle, GalleryImage, VoiceActor } from "./types";

// --- "DATABASE" TABLES ---

const animes: TitleInfo[] = [
    {
        id: '1',
        title: 'Honzuki no Gekokujou: Shisho ni Naru Tame ni wa Shudan o Erande Iraremasen',
        type: 'anime',
        description: 'In a world where hunters, humans with supernatural abilities, must battle deadly monsters to protect mankind, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after a brutal encounter in a hidden dungeon, he is chosen by a mysterious program called the System, which grants him the unique ability to grow in strength without limit. Follow Jinwoo’s journey as he rises from the weakest hunter to the strongest in existence.',
        imageUrl: 'https://picsum.photos/seed/sololeveling/400/600',
        imageHint: 'anime cover art',
        rating: 9.2,
        ranking: 1,
        commentsCount: 12500,
        listsCount: 35000,
    }
];

const animeDetails: (Omit<AnimeDetails, 'characters' | 'episodesList' | 'reviews' | 'related' | 'galleryImages'> & { animeId: string })[] = [
    {
        animeId: '1',
        type: 'TV',
        episodes: 12,
        releaseDate: '2024-01-07',
        promotion: 'Aniplex',
        producer: 'A-1 Pictures',
        licensors: ['Crunchyroll'],
        genres: ['Action', 'Fantasy', 'Adventure'],
        duration: '23 min per ep',
        rating: 'PG-13',
        alternativeTitles: [
            { lang: 'Japanese', flag: '🇯🇵', title: '俺だけレベルアップな件' },
            { lang: 'English', flag: '🇺🇸', title: 'Solo Leveling' },
        ],
        stats: {
            score: 9.2,
            popularity: 1,
            favorites: 150000,
            completed: 250000,
            watching: 500000,
            planToWatch: 120000,
        },
    }
];

const voiceActors: (VoiceActor & { id: string })[] = [
    { id: 'va1', name: 'Taito Ban', imageUrl: 'https://picsum.photos/seed/taitoban/200/300', imageHint: 'Taito Ban voice actor' },
    { id: 'va2', name: 'Masumi Tazawa', imageUrl: 'https://picsum.photos/seed/masumitazawa/200/300', imageHint: 'Masumi Tazawa voice actor' },
    { id: 'va3', name: 'Reina Ueda', imageUrl: 'https://picsum.photos/seed/reinaueda/200/300', imageHint: 'Reina Ueda voice actor' },
    { id: 'va4', name: 'Gema Carballedo', imageUrl: 'https://picsum.photos/seed/gemacarballedo/200/300', imageHint: 'Gema Carballedo voice actor' },
];

const characters: (Omit<Character, 'voiceActors'> & { animeId: string; japaneseVoiceActorId: string; spanishVoiceActorId: string; })[] = [
    {
        id: 'char1',
        animeId: '1',
        name: 'Sung Jinwoo',
        imageUrl: 'https://picsum.photos/seed/jinwoo/200/300',
        imageHint: 'Sung Jinwoo character',
        role: 'Main',
        japaneseVoiceActorId: 'va1',
        spanishVoiceActorId: 'va2',
    },
    {
        id: 'char2',
        animeId: '1',
        name: 'Cha Hae-In',
        imageUrl: 'https://picsum.photos/seed/chahein/200/300',
        imageHint: 'Cha Hae-In character',
        role: 'Main',
        japaneseVoiceActorId: 'va3',
        spanishVoiceActorId: 'va4',
    }
];

const episodes: (Episode & { animeId: string })[] = Array.from({ length: 12 }, (_, i) => ({
    id: `ep${i + 1}`,
    animeId: '1',
    name: `Episode ${i + 1}`,
    imageUrl: `https://picsum.photos/seed/ep${i + 1}/320/180`,
    imageHint: `anime episode ${i + 1}`,
    duration: '23 min',
    comments: Math.floor(Math.random() * 2000),
}));

const reviews: (Review & { animeId: string })[] = [
    {
        id: 'rev1',
        animeId: '1',
        title: 'Amazing adaptation!',
        user: { name: 'AnimeFan123', imageUrl: 'https://picsum.photos/seed/user1/100/100', imageHint: 'user avatar' },
        rating: 9, review: 'The animation is top-notch and stays true to the source material. A must-watch for any fan of the manhwa. The action scenes are breathtaking and the character development of Sung Jinwoo is perfectly portrayed.'
    },
    {
        id: 'rev2',
        animeId: '1',
        title: 'A solid start, but...',
        user: { name: 'WebtoonReader', imageUrl: 'https://picsum.photos/seed/user2/100/100', imageHint: 'user avatar' },
        rating: 8, review: 'Pacing is a bit fast compared to the webtoon, but the action scenes are incredible. Some details are missed, but overall a great adaptation that captures the essence of Solo Leveling.'
    },
];

const relatedTitles: (RelatedTitle & { animeId: string })[] = [
    { id: 'rel1', animeId: '1', title: 'Solo Leveling (Manhwa)', type: 'Adaptation', imageUrl: 'https://picsum.photos/seed/rel1/200/300', imageHint: 'manhwa cover' },
    { id: 'rel2', animeId: '1', title: 'The Beginning After the End', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel2/200/300', imageHint: 'manhwa cover' },
    { id: 'rel3', animeId: '1', title: 'Tower of God', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel3/200/300', imageHint: 'anime cover' },
];

const galleryImages: (GalleryImage & { animeId: string })[] = Array.from({ length: 6 }, (_, i) => ({
    id: `gallery${i + 1}`,
    animeId: '1',
    imageUrl: `https://picsum.photos/seed/gallery${i + 1}/600/400`,
    imageHint: 'anime screenshot'
}));

const officialLinks: (OfficialLinks & { animeId: string })[] = [
    {
        animeId: '1',
        officialSites: [
            { name: 'Official Website', url: '#' },
            { name: 'Official X', url: '#' },
        ],
        streamingPlatforms: [
            { name: 'Crunchyroll', url: '#' },
            { name: 'Netflix', url: '#' },
        ],
        fanTranslations: [
            { name: 'Fan Sub Group A (Social)', url: '#' },
            { name: 'Fan Sub Group B (Social)', url: '#' },
        ]
    }
];

// --- "DATABASE QUERY" FUNCTIONS ---

// This function simulates joining the tables to get all data for a specific anime page.
export function getAnimePageData(animeId: string) {
    const anime = animes.find(a => a.id === animeId);
    if (!anime) return null;

    const details = animeDetails.find(d => d.animeId === animeId);
    if (!details) return null;

    const links = officialLinks.find(l => l.animeId === animeId);
    if (!links) return null;

    const animeCharacters = characters
        .filter(c => c.animeId === animeId)
        .map(c => {
            const japanese = voiceActors.find(va => va.id === c.japaneseVoiceActorId);
            const spanish = voiceActors.find(va => va.id === c.spanishVoiceActorId);
            return {
                ...c,
                voiceActors: {
                    japanese: japanese!,
                    spanish: spanish!,
                }
            }
        });

    const animeEpisodes = episodes.filter(e => e.animeId === animeId);
    const animeReviews = reviews.filter(r => r.animeId === animeId);
    const animeRelated = relatedTitles.filter(rt => rt.animeId === animeId);
    const animeGallery = galleryImages.filter(gi => gi.animeId === animeId);

    return {
        titleInfo: anime,
        details: { ...details, characters: [], episodesList: [], reviews: [], related: [], galleryImages: [] },
        officialLinks: links,
        characters: animeCharacters,
        episodes: animeEpisodes,
        reviews: animeReviews,
        related: animeRelated,
        galleryImages: animeGallery,
    };
}
