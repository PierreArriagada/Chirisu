import type { AnimeDetails, TitleInfo, OfficialLinks, Character, Episode, Review, RelatedTitle, GalleryImage, VoiceActor, MediaType, CharacterRole } from "./types";

// --- "DATABASE" TABLES ---

const titles: Omit<TitleInfo, 'slug'>[] = [
    {
        id: '1',
        title: 'Honzuki no Gekokujou: Shisho ni Naru Tame ni wa Shudan o Erande Iraremasen',
        type: 'Anime',
        description: 'In a world where hunters, humans with supernatural abilities, must battle deadly monsters to protect mankind, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after a brutal encounter in a hidden dungeon, he is chosen by a mysterious program called the System, which grants him the unique ability to grow in strength without limit. Follow Jinwoo’s journey as he rises from the weakest hunter to the strongest in existence.',
        imageUrl: 'https://picsum.photos/seed/sololeveling/400/600',
        imageHint: 'anime cover art',
        rating: 9.2,
        ranking: 1,
        commentsCount: 12500,
        listsCount: 35000,
    },
    {
        id: '2',
        title: 'Berserk',
        type: 'Manga',
        description: 'Guts, a former mercenary now known as the "Black Swordsman," is out for revenge. After a tumultuous childhood, he finally finds someone he respects and believes he can trust, only to have everything taken away from him when this person takes advantage of a monstrous sacrifice.',
        imageUrl: 'https://picsum.photos/seed/berserk/400/600',
        imageHint: 'manga cover art',
        rating: 9.8,
        ranking: 1,
        commentsCount: 25000,
        listsCount: 50000,
    },
    {
        id: '3',
        title: 'Che Daojuan',
        type: 'Manhua',
        description: 'A story about a young man who is a talented military strategist and his journey to unite a divided land. He faces many challenges and makes many sacrifices along the way.',
        imageUrl: 'https://picsum.photos/seed/chedajuan/400/600',
        imageHint: 'manhua cover art',
        rating: 8.9,
        ranking: 15,
        commentsCount: 8000,
        listsCount: 12000,
    },
    {
        id: '4',
        title: 'The Boxer',
        type: 'Manwha',
        description: 'A story about a gifted young boxer who is scouted by a legendary trainer. He has a unique style of fighting that makes him a formidable opponent, but he has his own demons to fight outside of the ring.',
        imageUrl: 'https://picsum.photos/seed/theboxer/400/600',
        imageHint: 'manwha cover art',
        rating: 9.5,
        ranking: 5,
        commentsCount: 18000,
        listsCount: 28000,
    },
    {
        id: '5',
        title: 'The Lord of the Mysteries',
        type: 'Novela',
        description: 'With the rising tide of steam and machinery, who can be the true Lord of the Mysteries? A transmigrator from the modern world finds himself in a Victorian-era world of steam, machinery, and supernatural powers.',
        imageUrl: 'https://picsum.photos/seed/lotm/400/600',
        imageHint: 'novel cover art',
        rating: 9.7,
        ranking: 2,
        commentsCount: 22000,
        listsCount: 40000,
    },
    {
        id: '6',
        title: 'My Hero Academia: Vigilantes',
        type: 'Fan Comic',
        description: 'A fan-made comic that explores the world of My Hero Academia from the perspective of vigilantes who operate outside the law to protect the innocent.',
        imageUrl: 'https://picsum.photos/seed/mhavigilantes/400/600',
        imageHint: 'fan comic cover art',
        rating: 8.5,
        ranking: 100,
        commentsCount: 5000,
        listsCount: 9000,
    },
     {
        id: '7',
        title: 'Mo Dao Zu Shi',
        type: 'Dougua',
        description: 'As the grandmaster who founded the Demonic Sect, Wei Wuxian roamed the world in his wanton ways, hated by millions for the chaos he created. In the end, he was backstabbed by his dearest shidi and killed by powerful clans that combined to overpower him. He incarnates into the body of a lunatic who was abandoned by his clan and is later, unwillingly, taken away by a famous cultivator among the clans—Lan Wangji, his archenemy.',
        imageUrl: 'https://picsum.photos/seed/modaozushi/400/600',
        imageHint: 'dougua cover art',
        rating: 9.4,
        ranking: 8,
        commentsCount: 15000,
        listsCount: 25000,
    },
];

const mediaDetails: (Omit<AnimeDetails, 'characters' | 'episodesList' | 'reviews' | 'related' | 'galleryImages'> & { mediaId: string })[] = [
    {
        mediaId: '1',
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
        stats: { score: 9.2, popularity: 1, favorites: 150000, completed: 250000, watching: 500000, planToWatch: 120000 },
    },
    {
        mediaId: '2',
        type: 'Manga',
        episodes: 0, // No episodes for manga
        releaseDate: '1989-08-25',
        promotion: 'Hakusensha',
        producer: 'Studio Gaga',
        licensors: ['Dark Horse Comics'],
        genres: ['Action', 'Dark Fantasy', 'Horror'],
        duration: 'N/A',
        rating: 'R - 17+',
        alternativeTitles: [ { lang: 'Japanese', flag: '🇯🇵', title: 'ベルセルク' } ],
        stats: { score: 9.8, popularity: 2, favorites: 300000, completed: 150000, watching: 80000, planToWatch: 50000 },
    },
     {
        mediaId: '7',
        type: 'ONA',
        episodes: 15,
        releaseDate: '2018-07-09',
        promotion: 'Tencent Penguin Pictures',
        producer: 'G.CMay Animation & Film',
        licensors: ['WeTV'],
        genres: ['Action', 'Adventure', 'Mystery', 'Supernatural'],
        duration: '24 min per ep',
        rating: 'PG-13',
        alternativeTitles: [ { lang: 'Chinese', flag: '🇨🇳', title: '魔道祖师' } ],
        stats: { score: 9.4, popularity: 8, favorites: 200000, completed: 180000, watching: 90000, planToWatch: 60000 },
    }
    // Add more details for other media types as needed
];

const voiceActorsRaw: (Omit<VoiceActor, 'slug'> & { id: string })[] = [
    { id: 'va1', name: 'Taito Ban', imageUrl: 'https://picsum.photos/seed/taitoban/200/300', imageHint: 'Taito Ban voice actor' },
    { id: 'va2', name: 'Masumi Tazawa', imageUrl: 'https://picsum.photos/seed/masumitazawa/200/300', imageHint: 'Masumi Tazawa voice actor' },
    { id: 'va3', name: 'Reina Ueda', imageUrl: 'https://picsum.photos/seed/reinaueda/200/300', imageHint: 'Reina Ueda voice actor' },
    { id: 'va4', name: 'Gema Carballedo', imageUrl: 'https://picsum.photos/seed/gemacarballedo/200/300', imageHint: 'Gema Carballedo voice actor' },
];

const charactersRaw: (Omit<Character, 'voiceActors' | 'slug'> & { mediaId: string; japaneseVoiceActorId: string; spanishVoiceActorId: string; })[] = [
    { id: 'char1', mediaId: '1', name: 'Sung Jinwoo', imageUrl: 'https://picsum.photos/seed/jinwoo/200/300', imageHint: 'Sung Jinwoo character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', },
    { id: 'char2', mediaId: '1', name: 'Cha Hae-In', imageUrl: 'https://picsum.photos/seed/chahein/200/300', imageHint: 'Cha Hae-In character', role: 'Main', japaneseVoiceActorId: 'va3', spanishVoiceActorId: 'va4', },
    { id: 'char3', mediaId: '2', name: 'Guts', imageUrl: 'https://picsum.photos/seed/guts/200/300', imageHint: 'Guts character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', }, // Reusing VAs for demo
    { id: 'char4', mediaId: '7', name: 'Wei Wuxian', imageUrl: 'https://picsum.photos/seed/weiwuxian/200/300', imageHint: 'Wei Wuxian character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', }
];

const episodes: (Episode & { mediaId: string })[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ id: `ep1-${i + 1}`, mediaId: '1', name: `Episode ${i + 1}`, imageUrl: `https://picsum.photos/seed/ep${i + 1}/320/180`, imageHint: `anime episode ${i + 1}`, duration: '23 min', releaseDate: new Date(2024, 0, 7 + i * 7).toISOString(), comments: Math.floor(Math.random() * 2000), watchLinks: { official: '#', crunchyroll: '#' } })),
    ...Array.from({ length: 15 }, (_, i) => ({ id: `ep7-${i + 1}`, mediaId: '7', name: `Episode ${i + 1}`, imageUrl: `https://picsum.photos/seed/dep${i + 1}/320/180`, imageHint: `dougua episode ${i + 1}`, duration: '24 min', releaseDate: new Date(2018, 6, 9 + i*7).toISOString(), comments: Math.floor(Math.random() * 1500), watchLinks: { official: '#', wetv: '#' } })),
];

const reviews: (Review & { mediaId: string })[] = [
    { id: 'rev1', mediaId: '1', title: 'Amazing adaptation!', user: { name: 'AnimeFan123', imageUrl: 'https://picsum.photos/seed/user1/100/100', imageHint: 'user avatar' }, rating: 9, review: 'The animation is top-notch and stays true to the source material. A must-watch for any fan of the manhwa. The action scenes are breathtaking and the character development of Sung Jinwoo is perfectly portrayed.' },
    { id: 'rev2', mediaId: '1', title: 'A solid start, but...', user: { name: 'WebtoonReader', imageUrl: 'https://picsum.photos/seed/user2/100/100', imageHint: 'user avatar' }, rating: 8, review: 'Pacing is a bit fast compared to the webtoon, but the action scenes are incredible. Some details are missed, but overall a great adaptation that captures the essence of Solo Leveling.' },
    { id: 'rev3', mediaId: '2', title: 'A masterpiece of dark fantasy.', user: { name: 'MangaMaster', imageUrl: 'https://picsum.photos/seed/user3/100/100', imageHint: 'user avatar' }, rating: 10, review: 'Kentaro Miura\'s artwork is breathtaking. The story is a profound exploration of human nature, struggle, and hope. It\'s not for the faint of heart, but it is an unforgettable experience.' },
];

const relatedTitlesRaw: (Omit<RelatedTitle, 'slug'> & { mediaId: string })[] = [
    { id: 'rel1', mediaId: '1', title: 'Solo Leveling (Manhwa)', type: 'Adaptation', imageUrl: 'https://picsum.photos/seed/rel1/200/300', imageHint: 'manhwa cover' },
    { id: 'rel2', mediaId: '1', title: 'The Beginning After the End', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel2/200/300', imageHint: 'manhwa cover' },
    { id: 'rel3', mediaId: '2', title: 'Vagabond', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/vagabond/200/300', imageHint: 'manga cover' },
];

const galleryImages: (GalleryImage & { mediaId: string })[] = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `gallery${i + 1}`, mediaId: '1', imageUrl: `https://picsum.photos/seed/gallery${i + 1}/600/400`, imageHint: 'anime screenshot' })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `gallery_b${i + 1}`, mediaId: '2', imageUrl: `https://picsum.photos/seed/gallery_b${i + 1}/600/400`, imageHint: 'manga panel' }))
];


const officialLinks: (OfficialLinks & { mediaId: string })[] = [
    {
        mediaId: '1',
        officialSites: [{ name: 'Official Website', url: '#' }, { name: 'Official X', url: '#' }],
        streamingPlatforms: [{ name: 'Crunchyroll', url: '#' }, { name: 'Netflix', url: '#' }],
        fanTranslations: [{ name: 'Fan Sub Group A (Social)', url: '#' }],
    },
    {
        mediaId: '2',
        officialSites: [{ name: 'Dark Horse Comics', url: '#' }],
        streamingPlatforms: [],
        fanTranslations: [{ name: 'Fan Translation Site', url: '#' }],
    }
];


// --- DATA PROCESSING ---
const createSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const processedTitles: TitleInfo[] = titles.map(t => ({ ...t, slug: createSlug(t.title) }));
const processedVoiceActors: VoiceActor[] = voiceActorsRaw.map(va => ({ ...va, slug: createSlug(va.name) }));
const processedCharacters: Character[] = charactersRaw.map(c => {
    const japanese = processedVoiceActors.find(va => va.id === c.japaneseVoiceActorId)!;
    const spanish = processedVoiceActors.find(va => va.id === c.spanishVoiceActorId)!;
    return {
        ...c,
        slug: createSlug(c.name),
        voiceActors: { japanese, spanish }
    };
});
const processedRelatedTitles: RelatedTitle[] = relatedTitlesRaw.map(rt => ({...rt, slug: createSlug(rt.title)}));


// --- "DATABASE QUERY" FUNCTIONS ---

export function getMediaBySlug(slug: string) {
    return processedTitles.find(a => a.slug === slug);
}

export function getEpisodeById(id: string) {
    return episodes.find(e => e.id === id);
}

export function getCharacterBySlug(slug: string) {
    return processedCharacters.find(c => c.slug === slug);
}

export function getVoiceActorBySlug(slug: string) {
    return processedVoiceActors.find(va => va.slug === slug);
}


// This function simulates joining the tables to get all data for a specific media page.
export function getMediaPageData(mediaIdOrSlug: string, mediaType: MediaType) {
    const title = processedTitles.find(a => (a.id === mediaIdOrSlug || a.slug === mediaIdOrSlug) && a.type.toLowerCase().replace(' ', '-') === mediaType.toLowerCase());
    if (!title) return null;

    // Find details, fallback to a default object if not found for simplicity
    const details = mediaDetails.find(d => d.mediaId === title.id) || {
        mediaId: title.id,
        type: title.type,
        episodes: 0,
        releaseDate: 'N/A',
        promotion: 'N/A',
        producer: 'N/A',
        licensors: [],
        genres: ['N/A'],
        duration: 'N/A',
        rating: 'N/A',
        alternativeTitles: [],
        stats: { score: title.rating, popularity: title.ranking, favorites: 0, completed: 0, watching: 0, planToWatch: 0 },
    };
    
    // Find links, fallback to empty
    const links = officialLinks.find(l => l.mediaId === title.id) || { mediaId: title.id, officialSites: [], streamingPlatforms: [], fanTranslations: [] };

    const mediaCharacters = processedCharacters.filter(c => c.mediaId === title.id);
    const mediaEpisodes = episodes.filter(e => e.mediaId === title.id);
    const mediaReviews = reviews.filter(r => r.mediaId === title.id);
    const mediaRelated = processedRelatedTitles.filter(rt => rt.mediaId === title.id);
    const mediaGallery = galleryImages.filter(gi => gi.mediaId === title.id);

    return {
        titleInfo: title,
        details: { ...details, characters: [], episodesList: [], reviews: [], related: [], galleryImages: [] },
        officialLinks: links,
        characters: mediaCharacters,
        episodes: mediaEpisodes,
        reviews: mediaReviews,
        related: mediaRelated,
        galleryImages: mediaGallery,
    };
}


export function getHomePageData() {
    // Return one of each type for the home page
    const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Manhua', 'Manwha', 'Novela', 'Fan Comic', 'Dougua'];
    const homePageMedia = mediaTypes.map(type => processedTitles.find(t => t.type === type)).filter(Boolean) as TitleInfo[];
    
    const featuredCharacter = processedCharacters.find(c => c.id === 'char1');
    const featuredVoiceActor = processedVoiceActors.find(va => va.id === 'va1');

    return {
        media: homePageMedia,
        featuredCharacter,
        featuredVoiceActor,
    }
}

export function getCharacterPageData(slug: string) {
    const character = processedCharacters.find(c => c.slug === slug);
    if (!character) return null;

    const media = processedTitles.find(t => t.id === character.mediaId);
    return { character, media };
}

export function getVoiceActorPageData(slug: string) {
    const voiceActor = processedVoiceActors.find(va => va.slug === slug);
    if (!voiceActor) return null;

    const roles: CharacterRole[] = [];
    const characterRoles = processedCharacters.filter(c => c.voiceActors.japanese.id === voiceActor.id || c.voiceActors.spanish.id === voiceActor.id);
    
    for (const char of characterRoles) {
        const media = processedTitles.find(t => t.id === char.mediaId);
        if(media) {
            roles.push({
                role: char.role,
                characterName: char.name,
                characterImageUrl: char.imageUrl,
                characterImageHint: char.imageHint,
                characterSlug: char.slug,
                mediaTitle: media.title,
                mediaType: media.type,
                mediaSlug: media.slug
            });
        }
    }
    
    return { voiceActor, roles };
}

// Deprecated function name, kept for compatibility if anything still uses it.
export const getAnimePageData = (animeId: string) => getMediaPageData(animeId, 'anime');
