import type { AnimeDetails, TitleInfo, OfficialLinks } from "./types";

export const mockTitle: TitleInfo = {
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
};

export const mockAnimeDetails: AnimeDetails = {
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
    characters: [
        {
            id: 'char1',
            name: 'Sung Jinwoo',
            imageUrl: 'https://picsum.photos/seed/jinwoo/200/300',
            imageHint: 'Sung Jinwoo character',
            role: 'Main',
            voiceActors: {
                japanese: { id: 'va1', name: 'Taito Ban', imageUrl: 'https://picsum.photos/seed/taitoban/200/300', imageHint: 'Taito Ban voice actor' },
                spanish: { id: 'va2', name: 'Masumi Tazawa', imageUrl: 'https://picsum.photos/seed/masumitazawa/200/300', imageHint: 'Masumi Tazawa voice actor' },
            }
        },
        {
            id: 'char2',
            name: 'Cha Hae-In',
            imageUrl: 'https://picsum.photos/seed/chahein/200/300',
            imageHint: 'Cha Hae-In character',
            role: 'Main',
            voiceActors: {
                japanese: { id: 'va3', name: 'Reina Ueda', imageUrl: 'https://picsum.photos/seed/reinaueda/200/300', imageHint: 'Reina Ueda voice actor' },
                spanish: { id: 'va4', name: 'Gema Carballedo', imageUrl: 'https://picsum.photos/seed/gemacarballedo/200/300', imageHint: 'Gema Carballedo voice actor' },
            }
        }
    ],
    episodesList: Array.from({ length: 12 }, (_, i) => ({
        id: `ep${i + 1}`,
        name: `Episode ${i + 1}`,
        imageUrl: `https://picsum.photos/seed/ep${i + 1}/320/180`,
        imageHint: `anime episode ${i + 1}`,
        duration: '23 min',
        comments: Math.floor(Math.random() * 2000),
    })),
    reviews: [
        { 
            id: 'rev1',
            title: 'Amazing adaptation!',
            user: { name: 'AnimeFan123', imageUrl: 'https://picsum.photos/seed/user1/100/100', imageHint: 'user avatar' },
            rating: 9, review: 'The animation is top-notch and stays true to the source material. A must-watch for any fan of the manhwa. The action scenes are breathtaking and the character development of Sung Jinwoo is perfectly portrayed.'
        },
        { 
            id: 'rev2',
            title: 'A solid start, but...',
            user: { name: 'WebtoonReader', imageUrl: 'https://picsum.photos/seed/user2/100/100', imageHint: 'user avatar' },
            rating: 8, review: 'Pacing is a bit fast compared to the webtoon, but the action scenes are incredible. Some details are missed, but overall a great adaptation that captures the essence of Solo Leveling.'
        },
    ],
    related: [
        { id: 'rel1', title: 'Solo Leveling (Manhwa)', type: 'Adaptation', imageUrl: 'https://picsum.photos/seed/rel1/200/300', imageHint: 'manhwa cover' },
        { id: 'rel2', title: 'The Beginning After the End', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel2/200/300', imageHint: 'manhwa cover' },
        { id: 'rel3', title: 'Tower of God', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel3/200/300', imageHint: 'anime cover' },
    ],
    galleryImages: Array.from({ length: 6 }, (_, i) => ({
        id: `gallery${i + 1}`,
        imageUrl: `https://picsum.photos/seed/gallery${i + 1}/600/400`,
        imageHint: 'anime screenshot'
    }))
};

export const mockOfficialLinks: OfficialLinks = {
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
};
