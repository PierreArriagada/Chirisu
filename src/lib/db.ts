import type { AnimeDetails, TitleInfo, OfficialLinks, Character, Episode, Review, RelatedTitle, GalleryImage, VoiceActor, MediaType, CharacterRole, User, CustomList } from "./types";

// --- "DATABASE" TABLES ---

const titles: Omit<TitleInfo, 'slug'>[] = [
    // === ANIME (10) ===
    {
        id: '1', // Detailed
        title: 'Honzuki no Gekokujou: Shisho ni Naru Tame ni wa Shudan o Erande Iraremasen',
        type: 'Anime',
        description: 'A studious college student and book lover who dies in an accident is reborn in another world as Myne, a frail 5-year-old girl. In a world with a low literacy rate and where books are a luxury for the nobility, she resolves to create her own books so she can read again.',
        imageUrl: 'https://picsum.photos/seed/honzuki/400/600',
        imageHint: 'anime cover art',
        rating: 9.2,
        ranking: 1,
        commentsCount: 12500,
        listsCount: 35000,
    },
    { id: 'attack-on-titan-anime', title: 'Attack on Titan', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/aot/400/600', imageHint: 'anime cover', rating: 9.1, ranking: 2, commentsCount: 50000, listsCount: 100000 },
    { id: 'death-note-anime', title: 'Death Note', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/deathnote/400/600', imageHint: 'anime cover', rating: 8.9, ranking: 3, commentsCount: 45000, listsCount: 90000 },
    { id: 'jujutsu-kaisen-anime', title: 'Jujutsu Kaisen', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/jjk/400/600', imageHint: 'anime cover', rating: 8.8, ranking: 4, commentsCount: 42000, listsCount: 85000 },
    { id: 'demon-slayer-anime', title: 'Demon Slayer: Kimetsu no Yaiba', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/demonslayer/400/600', imageHint: 'anime cover', rating: 8.7, ranking: 5, commentsCount: 48000, listsCount: 95000 },
    { id: 'steins-gate-anime', title: 'Steins;Gate', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/sgate/400/600', imageHint: 'anime cover', rating: 9.0, ranking: 6, commentsCount: 38000, listsCount: 70000 },
    { id: 'fmab-anime', title: 'Fullmetal Alchemist: Brotherhood', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/fmab/400/600', imageHint: 'anime cover', rating: 9.3, ranking: 7, commentsCount: 55000, listsCount: 110000 },
    { id: 'code-geass-anime', title: 'Code Geass: Lelouch of the Rebellion', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/codegeass/400/600', imageHint: 'anime cover', rating: 8.9, ranking: 9, commentsCount: 40000, listsCount: 80000 },
    { id: 'hunter-x-hunter-anime', title: 'Hunter x Hunter (2011)', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/hxh/400/600', imageHint: 'anime cover', rating: 9.0, ranking: 13, commentsCount: 43000, listsCount: 88000 },
    { id: 'vinland-saga-anime', title: 'Vinland Saga', type: 'Anime', description: '', imageUrl: 'https://picsum.photos/seed/vinlandsaga/400/600', imageHint: 'anime cover', rating: 8.8, ranking: 14, commentsCount: 35000, listsCount: 65000 },

    // === MANGA (10) ===
    {
        id: 'berserk-manga', // Detailed
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
    { id: 'one-piece-manga', title: 'One Piece', type: 'Manga', description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.', imageUrl: 'https://picsum.photos/seed/onepiece/400/600', imageHint: 'manga cover art', rating: 9.9, ranking: 2, commentsCount: 60000, listsCount: 120000 },
    { id: 'vagabond-manga', title: 'Vagabond', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/vagabondmanga/400/600', imageHint: 'manga cover', rating: 9.7, ranking: 3, commentsCount: 22000, listsCount: 45000 },
    { id: 'vinland-saga-manga-m', title: 'Vinland Saga', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/vinland/400/600', imageHint: 'manga cover', rating: 9.6, ranking: 4, commentsCount: 20000, listsCount: 40000 },
    { id: 'kingdom-manga', title: 'Kingdom', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/kingdom/400/600', imageHint: 'manga cover', rating: 9.5, ranking: 5, commentsCount: 18000, listsCount: 35000 },
    { id: 'monster-manga', title: 'Monster', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/monster/400/600', imageHint: 'manga cover', rating: 9.4, ranking: 8, commentsCount: 23000, listsCount: 48000 },
    { id: 'slam-dunk-manga', title: 'Slam Dunk', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/slamdunk/400/600', imageHint: 'manga cover', rating: 9.3, ranking: 11, commentsCount: 15000, listsCount: 30000 },
    { id: 'punpun-manga', title: 'Oyasumi Punpun', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/punpun/400/600', imageHint: 'manga cover', rating: 9.2, ranking: 16, commentsCount: 19000, listsCount: 38000 },
    { id: '20th-century-boys-manga', title: '20th Century Boys', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/20thcb/400/600', imageHint: 'manga cover', rating: 9.1, ranking: 17, commentsCount: 17000, listsCount: 33000 },
    { id: 'gto-manga', title: 'Great Teacher Onizuka', type: 'Manga', description: '', imageUrl: 'https://picsum.photos/seed/gto/400/600', imageHint: 'manga cover', rating: 9.0, ranking: 19, commentsCount: 16000, listsCount: 31000 },

    // === DOUGA (10) ===
    {
        id: 'modaozushi-dougua', // Detailed
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
    { id: 'the-kings-avatar-dougua', title: 'The King\'s Avatar', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/tka/400/600', imageHint: 'dougua cover', rating: 9.0, ranking: 12, commentsCount: 12000, listsCount: 22000 },
    { id: 'fog-hill-of-five-elements-dougua', title: 'Fog Hill of Five Elements', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/fhofe/400/600', imageHint: 'dougua cover', rating: 9.1, ranking: 11, commentsCount: 13000, listsCount: 23000 },
    { id: 'heaven-officials-blessing-dougua', title: 'Heaven Official\'s Blessing', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/hob/400/600', imageHint: 'dougua cover', rating: 9.3, ranking: 9, commentsCount: 14000, listsCount: 24000 },
    { id: 'link-click-dougua', title: 'Link Click', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/linkclick/400/600', imageHint: 'dougua cover', rating: 9.2, ranking: 10, commentsCount: 16000, listsCount: 28000 },
    { id: 'scissor-seven-dougua', title: 'Scissor Seven', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/scissor7/400/600', imageHint: 'dougua cover', rating: 8.9, ranking: 15, commentsCount: 11000, listsCount: 20000 },
    { id: 'daily-life-immortal-king-dougua', title: 'The Daily Life of the Immortal King', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/dliok/400/600', imageHint: 'dougua cover', rating: 8.5, ranking: 25, commentsCount: 9000, listsCount: 18000 },
    { id: 'rakshasa-street-dougua', title: 'Rakshasa Street', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/rakshasa/400/600', imageHint: 'dougua cover', rating: 8.6, ranking: 22, commentsCount: 8000, listsCount: 15000 },
    { id: 'spare-me-great-lord-dougua', title: 'Spare Me, Great Lord!', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/smgl/400/600', imageHint: 'dougua cover', rating: 8.7, ranking: 20, commentsCount: 10000, listsCount: 19000 },
    { id: 'battle-through-the-heavens-dougua', title: 'Battle Through the Heavens', type: 'Dougua', description: '', imageUrl: 'https://picsum.photos/seed/btth/400/600', imageHint: 'dougua cover', rating: 8.8, ranking: 18, commentsCount: 11500, listsCount: 21000 },

    // === NOVELA (10) ===
    {
        id: 'lotm-novela', // Detailed
        title: 'Lord of the Mysteries',
        type: 'Novela',
        description: 'With the rising tide of steam and machinery, who can be the true Lord of the Mysteries? A transmigrator from the modern world finds himself in a Victorian-era world of steam, machinery, and supernatural powers.',
        imageUrl: 'https://picsum.photos/seed/lotm/400/600',
        imageHint: 'novel cover art',
        rating: 9.7,
        ranking: 2,
        commentsCount: 22000,
        listsCount: 40000,
    },
    { id: 'reverend-insanity-novela', title: 'Reverend Insanity', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/ri/400/600', imageHint: 'novel cover', rating: 9.8, ranking: 1, commentsCount: 25000, listsCount: 45000 },
    { id: 'shadow-slave-novela', title: 'Shadow Slave', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/sslave/400/600', imageHint: 'novel cover', rating: 9.3, ranking: 7, commentsCount: 18000, listsCount: 32000 },
    { id: 'mushoku-tensei-novela', title: 'Mushoku Tensei: Jobless Reincarnation', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/mushoku/400/600', imageHint: 'novel cover', rating: 9.0, ranking: 10, commentsCount: 16000, listsCount: 30000 },
    { id: 'overlord-novela', title: 'Overlord', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/overlord/400/600', imageHint: 'novel cover', rating: 9.1, ranking: 9, commentsCount: 17000, listsCount: 31000 },
    { id: 'classroom-of-the-elite-novela', title: 'Classroom of the Elite', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/cote/400/600', imageHint: 'novel cover', rating: 9.2, ranking: 8, commentsCount: 19000, listsCount: 34000 },
    { id: 'tbate-novela', title: 'The Beginning After the End', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/tbatenov/400/600', imageHint: 'novel cover', rating: 9.6, ranking: 3, commentsCount: 21000, listsCount: 39000 },
    { id: 'konosuba-novela', title: 'KonoSuba: God\'s Blessing on This Wonderful World!', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/konosuba/400/600', imageHint: 'novel cover', rating: 8.8, ranking: 14, commentsCount: 14000, listsCount: 28000 },
    { id: 'rezero-novela', title: 'Re:Zero - Starting Life in Another World', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/rezero/400/600', imageHint: 'novel cover', rating: 8.9, ranking: 12, commentsCount: 15000, listsCount: 29000 },
    { id: 'sao-progressive-novela', title: 'Sword Art Online: Progressive', type: 'Novela', description: '', imageUrl: 'https://picsum.photos/seed/saop/400/600', imageHint: 'novel cover', rating: 8.7, ranking: 15, commentsCount: 13000, listsCount: 27000 },

    // === FAN COMIC (10) ===
    {
        id: 'mha-vigilantes-fan-comic', // Detailed
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
    { id: 'atla-imbalance-fan-comic', title: 'Avatar: The Last Airbender - Imbalance', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/atlaim/400/600', imageHint: 'fan comic cover', rating: 8.8, ranking: 90, commentsCount: 6000, listsCount: 10000 },
    { id: 'dragon-ball-multiverse-fan-comic', title: 'Dragon Ball Multiverse', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/dbm/400/600', imageHint: 'fan comic cover', rating: 8.2, ranking: 110, commentsCount: 7000, listsCount: 12000 },
    { id: 'superman-son-of-kal-el-fan-comic', title: 'Superman: Son of Kal-El Tribute', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/sok/400/600', imageHint: 'fan comic cover', rating: 8.1, ranking: 120, commentsCount: 4000, listsCount: 8000 },
    { id: 'star-wars-legacy-fan-comic', title: 'Star Wars: Legacy\'s End', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/swle/400/600', imageHint: 'fan comic cover', rating: 8.6, ranking: 95, commentsCount: 5500, listsCount: 9500 },
    { id: 'zelda-forgotten-hymn-fan-comic', title: 'Zelda: Forgotten Hymn', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/zfh/400/600', imageHint: 'fan comic cover', rating: 8.9, ranking: 85, commentsCount: 6500, listsCount: 11000 },
    { id: 'pokemon-journeys-end-fan-comic', title: 'Pokemon: Journey\'s End', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/pje/400/600', imageHint: 'fan comic cover', rating: 8.0, ranking: 130, commentsCount: 3500, listsCount: 7000 },
    { id: 'naruto-new-age-fan-comic', title: 'Naruto: The New Age', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/ntna/400/600', imageHint: 'fan comic cover', rating: 7.9, ranking: 140, commentsCount: 3000, listsCount: 6000 },
    { id: 'metroid-legacy-fan-comic', title: 'Metroid: Legacy', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/metroleg/400/600', imageHint: 'fan comic cover', rating: 8.4, ranking: 105, commentsCount: 4500, listsCount: 8500 },
    { id: 'final-fantasy-echoes-fan-comic', title: 'Final Fantasy: Echoes of the End', type: 'Fan Comic', description: '', imageUrl: 'https://picsum.photos/seed/ffee/400/600', imageHint: 'fan comic cover', rating: 8.3, ranking: 115, commentsCount: 4200, listsCount: 8200 },

    // === MANHUA (10) ===
    {
        id: 'che-daojuan-manhua', // Detailed
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
    { id: 'tales-of-demons-and-gods-manhua', title: 'Tales of Demons and Gods', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/todg/400/600', imageHint: 'manhua cover', rating: 8.5, ranking: 20, commentsCount: 7000, listsCount: 11000 },
    { id: 'versatile-mage-manhua', title: 'Versatile Mage', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/vmage/400/600', imageHint: 'manhua cover', rating: 8.3, ranking: 22, commentsCount: 6500, listsCount: 10000 },
    { id: 'soul-land-manhua', title: 'Soul Land', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/soulland/400/600', imageHint: 'manhua cover', rating: 8.7, ranking: 18, commentsCount: 7500, listsCount: 11500 },
    { id: 'apotheosis-manhua', title: 'Apotheosis', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/apotheosis/400/600', imageHint: 'manhua cover', rating: 8.6, ranking: 19, commentsCount: 7200, listsCount: 11200 },
    { id: 'martial-peak-manhua', title: 'Martial Peak', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/martialpeak/400/600', imageHint: 'manhua cover', rating: 8.4, ranking: 21, commentsCount: 6800, listsCount: 10800 },
    { id: 'the-great-ruler-manhua', title: 'The Great Ruler', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/tgruler/400/600', imageHint: 'manhua cover', rating: 8.2, ranking: 24, commentsCount: 6000, listsCount: 9500 },
    { id: 'yuan-zun-manhua', title: 'Yuan Zun', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/yuanzun/400/600', imageHint: 'manhua cover', rating: 8.8, ranking: 17, commentsCount: 7800, listsCount: 11800 },
    { id: 'panlong-manhua', title: 'Panlong', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/panlong/400/600', imageHint: 'manhua cover', rating: 8.1, ranking: 26, commentsCount: 5800, listsCount: 9200 },
    { id: 'i-am-the-sorcerer-king-manhua', title: 'I Am the Sorcerer King', type: 'Manhua', description: '', imageUrl: 'https://picsum.photos/seed/sorcererking/400/600', imageHint: 'manhua cover', rating: 8.0, ranking: 30, commentsCount: 5500, listsCount: 9000 },

    // === MANWHA (10) ===
    {
        id: 'the-boxer-manwha', // Detailed
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
    { id: 'tower-of-god-manwha', title: 'Tower of God', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/tog/400/600', imageHint: 'manwha cover', rating: 9.4, ranking: 6, commentsCount: 17000, listsCount: 27000 },
    { id: 'tbate-manwha', title: 'The Beginning After the End', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/tbate/400/600', imageHint: 'manwha cover', rating: 9.6, ranking: 4, commentsCount: 19000, listsCount: 29000 },
    { id: 'orv-manwha', title: 'Omniscient Reader\'s Viewpoint', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/orv/400/600', imageHint: 'manwha cover', rating: 9.7, ranking: 3, commentsCount: 20000, listsCount: 30000 },
    { id: 'the-legend-of-the-northern-blade-manwha', title: 'The Legend of the Northern Blade', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/northernblade/400/600', imageHint: 'manwha cover', rating: 9.3, ranking: 8, commentsCount: 16000, listsCount: 26000 },
    { id: 'sweet-home-manwha', title: 'Sweet Home', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/sweethome/400/600', imageHint: 'manwha cover', rating: 9.0, ranking: 11, commentsCount: 14000, listsCount: 24000 },
    { id: 'bastard-manwha', title: 'Bastard', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/bastard/400/600', imageHint: 'manwha cover', rating: 9.2, ranking: 9, commentsCount: 15000, listsCount: 25000 },
    { id: 'wind-breaker-manwha', title: 'Wind Breaker', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/windbreaker/400/600', imageHint: 'manwha cover', rating: 8.9, ranking: 13, commentsCount: 13000, listsCount: 23000 },
    { id: 'lookism-manwha', title: 'Lookism', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/lookism/400/600', imageHint: 'manwha cover', rating: 8.8, ranking: 14, commentsCount: 12000, listsCount: 22000 },
    { id: 'gosu-manwha', title: 'Gosu', type: 'Manwha', description: '', imageUrl: 'https://picsum.photos/seed/gosu/400/600', imageHint: 'manwha cover', rating: 9.1, ranking: 10, commentsCount: 14500, listsCount: 24500 },
];

const createSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const processedTitles: TitleInfo[] = titles.map(t => ({ ...t, slug: createSlug(t.title) }));

const generateUserLists = () => ({
    pending: [processedTitles[2], processedTitles[4]],
    following: [processedTitles[0]],
    watched: [processedTitles[1], processedTitles[3], processedTitles[6], processedTitles[7]],
    favorites: [processedTitles[1], processedTitles[0]],
});

const generateCustomLists = (): CustomList[] => ([
    {
        id: 'cl1',
        name: 'Obras maestras del Seinen',
        items: [processedTitles.find(t => t.id === 'berserk-manga')!],
        isPublic: true,
    },
    {
        id: 'cl2',
        name: 'Para leer en un día',
        items: [processedTitles.find(t => t.id === 'the-boxer-manwha')!, processedTitles.find(t => t.id === 'che-daojuan-manhua')!],
        isPublic: false,
    }
]);


export const simulatedUsers: (User & { password: string })[] = [
  {
    id: '1-admin',
    name: 'Admin Demo',
    email: 'admin@example.com',
    password: 'adminpassword',
    image: 'https://picsum.photos/seed/admin-avatar/100/100',
    role: 'admin',
    lists: generateUserLists(),
    listSettings: { pending: 'public', following: 'public', watched: 'private', favorites: 'public' },
    customLists: generateCustomLists(),
  },
  {
    id: '2-mod',
    name: 'Moderador Demo',
    email: 'moderator@example.com',
    password: 'modpassword',
    image: 'https://picsum.photos/seed/mod-avatar/100/100',
    role: 'moderator',
    lists: generateUserLists(),
    listSettings: { pending: 'public', following: 'public', watched: 'public', favorites: 'private' },
    customLists: [],
  },
  {
    id: '3-user',
    name: 'Usuario Demo',
    email: 'user@example.com',
    password: 'userpassword',
    image: 'https://picsum.photos/seed/user-avatar/100/100',
    role: 'user',
    lists: generateUserLists(),
    listSettings: { pending: 'private', following: 'public', watched: 'public', favorites: 'public' },
    customLists: generateCustomLists(),
  },
  {
    id: '4-user',
    name: 'MariaDB',
    email: 'maria@example.com',
    password: 'userpassword',
    image: 'https://picsum.photos/seed/user-avatar2/100/100',
    role: 'user',
    lists: generateUserLists(),
    listSettings: { pending: 'public', following: 'private', watched: 'private', favorites: 'private' },
    customLists: [],
  },
];


const mediaDetails: (Omit<AnimeDetails, 'characters' | 'episodesList' | 'reviews' | 'related' | 'galleryImages'> & { mediaId: string })[] = [
    {
        mediaId: '1', // Honzuki no Gekokujou
        type: 'TV',
        episodes: 36,
        releaseDate: '2019-10-03',
        promotion: 'TO Books',
        producer: 'Ajia-do Animation Works',
        licensors: ['Crunchyroll'],
        genres: ['Slice of Life', 'Fantasy', 'Isekai'],
        duration: '23 min per ep',
        rating: 'PG-13',
        alternativeTitles: [
            { lang: 'Japanese', flag: '🇯🇵', title: '本好きの下剋上 司書になるためには手段を選んでいられません' },
            { lang: 'English', flag: '🇺🇸', title: 'Ascendance of a Bookworm' },
        ],
        stats: { score: 9.2, popularity: 1, favorites: 150000, completed: 250000, watching: 500000, planToWatch: 120000 },
    },
    {
        mediaId: 'berserk-manga',
        type: 'Manga',
        episodes: 0, 
        releaseDate: '1989-08-25',
        promotion: 'Hakusensha',
        producer: 'Studio Gaga',
        licensors: ['Dark Horse Comics'],
        genres: ['Action', 'Dark Fantasy', 'Horror'],
        duration: 'N/A',
        rating: 'R - 17+',
        alternativeTitles: [ 
            { lang: 'Japanese', flag: '🇯🇵', title: 'ベルセルク' },
            { lang: 'Spanish', flag: '🇪🇸', title: 'Berserk' },
        ],
        stats: { score: 9.8, popularity: 2, favorites: 300000, completed: 150000, watching: 80000, planToWatch: 50000 },
    },
     {
        mediaId: 'modaozushi-dougua',
        type: 'ONA',
        episodes: 15,
        releaseDate: '2018-07-09',
        promotion: 'Tencent Penguin Pictures',
        producer: 'G.CMay Animation & Film',
        licensors: ['WeTV'],
        genres: ['Action', 'Adventure', 'Mystery', 'Supernatural'],
        duration: '24 min per ep',
        rating: 'PG-13',
        alternativeTitles: [ 
            { lang: 'Chinese', flag: '🇨🇳', title: '魔道祖师' },
            { lang: 'English', flag: '🇺🇸', title: 'Grandmaster of Demonic Cultivation' },
        ],
        stats: { score: 9.4, popularity: 8, favorites: 200000, completed: 180000, watching: 90000, planToWatch: 60000 },
    },
    {
        mediaId: 'lotm-novela',
        type: 'Web Novel',
        episodes: 1430, // Chapters
        releaseDate: '2018-04-01',
        promotion: 'Qidian',
        producer: 'N/A',
        licensors: ['Webnovel'],
        genres: ['Action', 'Fantasy', 'Mystery', 'Supernatural'],
        duration: 'N/A',
        rating: 'PG-13',
        alternativeTitles: [
            { lang: 'Chinese', flag: '🇨🇳', title: '诡秘之主' },
            { lang: 'English', flag: '🇺🇸', title: 'Lord of the Mysteries' },
        ],
        stats: { score: 9.7, popularity: 2, favorites: 250000, completed: 200000, watching: 50000, planToWatch: 30000 },
    },
    {
        mediaId: 'mha-vigilantes-fan-comic',
        type: 'Fan-made',
        episodes: 126, // Chapters
        releaseDate: '2016-08-20',
        promotion: 'Shonen Jump+',
        producer: 'N/A',
        licensors: ['Viz Media'],
        genres: ['Action', 'Comedy', 'Superhero'],
        duration: 'N/A',
        rating: 'T',
        alternativeTitles: [
            { lang: 'Japanese', flag: '🇯🇵', title: 'ヴィジランテ -僕のヒーローアカデミア ILLEGALS-' },
            { lang: 'English', flag: '🇺🇸', title: 'My Hero Academia: Vigilantes' },
        ],
        stats: { score: 8.5, popularity: 100, favorites: 5000, completed: 9000, watching: 2000, planToWatch: 3000 },
    },
    {
        mediaId: 'che-daojuan-manhua',
        type: 'Manhua',
        episodes: 0,
        releaseDate: '2015-01-01',
        promotion: 'Tencent Comics',
        producer: 'N/A',
        licensors: [],
        genres: ['Historical', 'Action', 'Drama'],
        duration: 'N/A',
        rating: 'T',
        alternativeTitles: [
            { lang: 'Chinese', flag: '🇨🇳', title: '車道卷' },
        ],
        stats: { score: 8.9, popularity: 15, favorites: 8000, completed: 12000, watching: 3000, planToWatch: 5000 },
    },
    {
        mediaId: 'the-boxer-manwha',
        type: 'Webtoon',
        episodes: 118,
        releaseDate: '2019-12-28',
        promotion: 'Naver',
        producer: 'JH',
        licensors: ['LINE Webtoon'],
        genres: ['Action', 'Drama', 'Sports', 'Psychological'],
        duration: 'N/A',
        rating: 'T',
        alternativeTitles: [
            { lang: 'Korean', flag: '🇰🇷', title: '더 복서' },
        ],
        stats: { score: 9.5, popularity: 5, favorites: 18000, completed: 28000, watching: 5000, planToWatch: 8000 },
    },
];

const voiceActorsRaw: (Omit<VoiceActor, 'slug'> & { id: string })[] = [
    { id: 'va1', name: 'Taito Ban', imageUrl: 'https://picsum.photos/seed/taitoban/200/300', imageHint: 'Taito Ban voice actor' },
    { id: 'va2', name: 'Gema Carballedo', imageUrl: 'https://picsum.photos/seed/gemacarballedo/200/300', imageHint: 'Gema Carballedo voice actor' },
    { id: 'va3', name: 'Reina Ueda', imageUrl: 'https://picsum.photos/seed/reinaueda/200/300', imageHint: 'Reina Ueda voice actor' },
    { id: 'va4', name: 'Yuka Iguchi', imageUrl: 'https://picsum.photos/seed/yukaiguchi/200/300', imageHint: 'Yuka Iguchi voice actor' },
];

const charactersRaw: (Omit<Character, 'voiceActors' | 'slug'> & { mediaId: string; japaneseVoiceActorId: string; spanishVoiceActorId: string; })[] = [
    { id: 'char1', mediaId: '1', name: 'Myne', imageUrl: 'https://picsum.photos/seed/myne/200/300', imageHint: 'Myne character', role: 'Main', japaneseVoiceActorId: 'va4', spanishVoiceActorId: 'va2', },
    { id: 'char2', mediaId: '1', name: 'Ferdinand', imageUrl: 'https://picsum.photos/seed/ferdinand/200/300', imageHint: 'Ferdinand character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', }, // reusing va
    { id: 'char3', mediaId: 'berserk-manga', name: 'Guts', imageUrl: 'https://picsum.photos/seed/guts/200/300', imageHint: 'Guts character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', }, // Reusing VAs for demo
    { id: 'char4', mediaId: 'modaozushi-dougua', name: 'Wei Wuxian', imageUrl: 'https://picsum.photos/seed/weiwuxian/200/300', imageHint: 'Wei Wuxian character', role: 'Main', japaneseVoiceActorId: 'va1', spanishVoiceActorId: 'va2', }
];

const episodes: (Episode & { mediaId: string })[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ id: `ep1-${i + 1}`, mediaId: '1', name: `Episode ${i + 1}`, imageUrl: `https://picsum.photos/seed/ep${i + 1}/320/180`, imageHint: `anime episode ${i + 1}`, duration: '23 min', releaseDate: new Date(2019, 9, 3 + i * 7).toISOString(), comments: Math.floor(Math.random() * 2000), watchLinks: { official: '#', crunchyroll: '#' } })),
    ...Array.from({ length: 15 }, (_, i) => ({ id: `ep7-${i + 1}`, mediaId: 'modaozushi-dougua', name: `Episode ${i + 1}`, imageUrl: `https://picsum.photos/seed/dep${i + 1}/320/180`, imageHint: `dougua episode ${i + 1}`, duration: '24 min', releaseDate: new Date(2018, 6, 9 + i*7).toISOString(), comments: Math.floor(Math.random() * 1500), watchLinks: { official: '#', wetv: '#' } })),
];

const reviews: (Review & { mediaId: string })[] = [
    { id: 'rev1', mediaId: '1', title: 'A Masterpiece for Book Lovers!', user: { name: 'BookwormFan', imageUrl: 'https://picsum.photos/seed/user1/100/100', imageHint: 'user avatar' }, rating: 10, review: 'This is not your typical isekai. It\'s a slow-paced, detailed story about the love for books and the struggle to achieve your dreams against all odds. Myne is an incredible protagonist.' },
    { id: 'rev2', mediaId: '1', title: 'Incredible world-building', user: { name: 'FantasyReader', imageUrl: 'https://picsum.photos/seed/user2/100/100', imageHint: 'user avatar' }, rating: 9, review: 'The level of detail in the world-building is insane. From the societal structure to the magic system, everything is meticulously crafted. Highly recommended.' },
    { id: 'rev3', mediaId: 'berserk-manga', title: 'A masterpiece of dark fantasy.', user: { name: 'MangaMaster', imageUrl: 'https://picsum.photos/seed/user3/100/100', imageHint: 'user avatar' }, rating: 10, review: 'Kentaro Miura\'s artwork is breathtaking. The story is a profound exploration of human nature, struggle, and hope. It\'s not for the faint of heart, but it is an unforgettable experience.' },
];

const relatedTitlesRaw: (Omit<RelatedTitle, 'slug'> & { mediaId: string })[] = [
    { id: 'rel1', mediaId: '1', title: 'Ascendance of a Bookworm (Manga)', type: 'Adaptation', imageUrl: 'https://picsum.photos/seed/rel1/200/300', imageHint: 'manga cover' },
    { id: 'rel2', mediaId: '1', title: 'Spice and Wolf', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/rel2/200/300', imageHint: 'anime cover' },
    { id: 'rel3', mediaId: 'berserk-manga', title: 'Vagabond', type: 'Recommendation', imageUrl: 'https://picsum.photos/seed/vagabond/200/300', imageHint: 'manga cover' },
];

const galleryImages: (GalleryImage & { mediaId: string })[] = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `gallery${i + 1}`, mediaId: '1', imageUrl: `https://picsum.photos/seed/gallery${i + 1}/600/400`, imageHint: 'anime screenshot' })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `gallery_b${i + 1}`, mediaId: 'berserk-manga', imageUrl: `https://picsum.photos/seed/gallery_b${i + 1}/600/400`, imageHint: 'manga panel' }))
];


const officialLinks: (OfficialLinks & { mediaId: string })[] = [
    {
        mediaId: '1',
        officialSites: [{ name: 'Official Website', url: '#' }, { name: 'Official X', url: '#' }],
        streamingPlatforms: [{ name: 'Crunchyroll', url: '#' }],
        fanTranslations: [{ name: 'Fan Sub Group A (Social)', url: '#' }],
    },
    {
        mediaId: 'berserk-manga',
        officialSites: [{ name: 'Dark Horse Comics', url: '#' }],
        streamingPlatforms: [],
        fanTranslations: [{ name: 'Fan Translation Site', url: '#' }],
    }
];


// --- DATA PROCESSING ---
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
    const mediaSlug = createSlug(mediaIdOrSlug);
    const title = processedTitles.find(a => (a.id === mediaIdOrSlug || a.slug === mediaSlug) && a.type.toLowerCase().replace(/ /g, '-') === mediaType.toLowerCase().replace(/ /g, '-'));
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
        alternativeTitles: [{ lang: 'English', flag: '🇺🇸', title: `${title.title}` }],
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

export function getMediaListPage(mediaType: MediaType) {
    const titlesOfType = processedTitles.filter(t => t.type === mediaType);
    
    const topAllTime = [...titlesOfType].sort((a, b) => a.ranking - b.ranking).slice(0, 10);
    // Simulate weekly top by shuffling and taking 5
    const topWeekly = [...titlesOfType].sort(() => 0.5 - Math.random()).slice(0, 5);

    return {
        topAllTime,
        topWeekly,
    };
}


// Deprecated function name, kept for compatibility if anything still uses it.
export const getAnimePageData = (animeId: string) => getMediaPageData(animeId, 'anime');

