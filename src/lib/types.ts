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
