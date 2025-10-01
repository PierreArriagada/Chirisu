import type { AnimeDetails, TitleInfo, OfficialLinks } from "./types";

export const mockTitle: TitleInfo = {
    id: '1',
    title: 'Honzuki no Gekokujou: Shisho ni Naru Tame ni wa Shudan o Erande Iraremasen',
    type: 'manga',
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
    episodesList: [
        { id: 'ep1', name: 'Episode 1', imageUrl: 'https://picsum.photos/seed/ep1/320/180', imageHint: 'anime episode 1', duration: '23 min', comments: 1500 },
        { id: 'ep2', name: 'Episode 2', imageUrl: 'https://picsum.photos/seed/ep2/320/180', imageHint: 'anime episode 2', duration: '23 min', comments: 1200 },
    ],
    reviews: [
        { id: 'rev1', user: 'AnimeFan123', rating: 9, review: 'Amazing adaptation! The animation is top-notch and stays true to the source material.' },
        { id: 'rev2', user: 'WebtoonReader', rating: 8, review: 'A solid start. Pacing is a bit fast, but the action scenes are incredible.' },
    ],
    related: [
        { id: 'rel1', title: 'Solo Leveling (Manhwa)', type: 'Adaptation' },
        { id: 'rel2', title: 'The Beginning After the End', type: 'Recommendation' },
    ]
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
