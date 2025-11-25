import { type RecommendSimilarTitlesOutput } from "@/ai/flows/recommend-similar-titles";

export type MediaType = 'Anime' | 'Manga' | 'Novela' | 'Donghua' | 'Manhua' | 'Manhwa' | 'Fan Comic';

export type UserRole = 'admin' | 'moderator' | 'user';

export type UserList = 'pending' | 'following' | 'watched' | 'favorites';

export type CustomList = {
  id: string;
  name: string;
  items: TitleInfo[];
  isPublic: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
  lists: {
    [K in UserList]: TitleInfo[];
  };
  listSettings: {
    [K in UserList]: 'public' | 'private';
  };
  customLists: CustomList[];
};

export type TitleInfo = {
  id: string;
  slug: string;
  title: string;
  type: MediaType;
  description: string;
  imageUrl: string;
  imageHint: string;
  rating: number;
  ranking: number;
  commentsCount: number;
  listsCount: number;
};

export type RecommendationInfo = RecommendSimilarTitlesOutput[0];

export type AlternativeTitle = {
  lang: string;
  flag: string;
  title: string;
};

export type VoiceActor = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  imageHint: string;
};

export type Character = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  imageHint: string;
  role: string;
  voiceActors: {
    japanese: VoiceActor;
    spanish: VoiceActor;
  };
};

export type Episode = {
  id: string;
  name: string;
  imageUrl: string;
  imageHint: string;
  duration: string;
  comments: number;
  releaseDate?: string;
  watchLinks?: Record<string, string>;
};

export type Review = {
    id: string;
    title: string;
    user: {
      name: string;
      imageUrl: string;
      imageHint: string;
    };
    rating: number;
    review: string;
};

export type RelatedTitle = {
    id: string;
    slug: string;
    title: string;
    type: string;
    imageUrl: string;
    imageHint: string;
};

export type OfficialLink = {
  name: string;
  url: string;
};

export type OfficialLinks = {
  officialSites: OfficialLink[];
  streamingPlatforms: OfficialLink[];
  fanTranslations: OfficialLink[];
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  imageHint: string;
}

export type AnimeDetails = {
  type: string;
  episodes: number;
  releaseDate: string;
  status: string;
  season: string;
  countryOfOrigin: string;
  promotion: string;
  producer: string;
  licensors: string[];
  genres: string[];
  duration: string;
  rating: string;
  alternativeTitles: AlternativeTitle[];
  stats: {
    score: number;
    popularity: number;
    favorites: number;
    completed: number;
    watching: number;
    planToWatch: number;
  };
  characters: Character[];
  episodesList: Episode[];
  reviews: Review[];
  related: RelatedTitle[];
  galleryImages: GalleryImage[];
};

// For voice actor page
export type CharacterRole = {
  role: string;
  characterName: string;
  characterImageUrl: string;
  characterImageHint: string;
  characterSlug: string;
  mediaTitle: string;
  mediaType: MediaType;
  mediaSlug: string;
};


// Moderation Types
export type Contribution = {
  id: string;
  mediaTitle: string;
  mediaType: MediaType;
  user: { id: string; name: string };
  date: string;
  changeType: 'Nueva Entrada' | 'Corrección';
  oldData?: { [key: string]: any };
  newData: { [key: string]: any };
};

export type ReportedComment = {
  id: string;
  content: string;
  reporter: string;
  reason: string;
  date: string;
};

// Comments Types
export type CommentUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
};

export type Comment = {
  id: string;
  commentableType: string;
  commentableId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isSpoiler: boolean;
  images: string[];
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  userLiked: boolean;
  // Para historial de usuario
  media?: {
    title: string;
    slug: string;
  };
  deletedAt?: string | null;
};
