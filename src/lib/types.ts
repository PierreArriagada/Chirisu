import { type RecommendSimilarTitlesOutput } from "@/ai/flows/recommend-similar-titles";

export type TitleInfo = {
  id: string;
  title: string;
  type: 'anime' | 'manga' | 'novel';
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
  name: string;
  imageUrl: string;
  imageHint: string;
};

export type Character = {
  id: string;
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

export type AnimeDetails = {
  type: string;
  episodes: number;
  releaseDate: string;
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
};
