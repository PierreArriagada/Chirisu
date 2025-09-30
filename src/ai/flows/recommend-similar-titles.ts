'use server';

/**
 * @fileOverview A flow to recommend similar titles (anime, manga, novels) based on a given title.
 *
 * - recommendSimilarTitles - A function that handles the recommendation process.
 * - RecommendSimilarTitlesInput - The input type for the recommendSimilarTitles function.
 * - RecommendSimilarTitlesOutput - The return type for the recommendSimilarTitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSimilarTitlesInputSchema = z.object({
  title: z.string().describe('The title of the anime, manga, or novel.'),
  type: z.enum(['anime', 'manga', 'novel']).describe('The type of the title.'),
  description: z.string().optional().describe('The description of the title.'),
});
export type RecommendSimilarTitlesInput = z.infer<typeof RecommendSimilarTitlesInputSchema>;

const RecommendSimilarTitlesOutputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the recommended item.'),
    type: z.enum(['anime', 'manga', 'novel']).describe('The type of the recommended item.'),
    similarityScore: z.number().describe('A score indicating the similarity to the input title.'),
    description: z.string().optional().describe('A brief description of the recommended title.'),
  })
);
export type RecommendSimilarTitlesOutput = z.infer<typeof RecommendSimilarTitlesOutputSchema>;

export async function recommendSimilarTitles(
  input: RecommendSimilarTitlesInput
): Promise<RecommendSimilarTitlesOutput> {
  return recommendSimilarTitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSimilarTitlesPrompt',
  input: {schema: RecommendSimilarTitlesInputSchema},
  output: {schema: RecommendSimilarTitlesOutputSchema},
  prompt: `You are an expert recommendation system for anime, manga, and novels.

  Based on the title, type, and description of the item provided, recommend other similar titles.
  Return a JSON array of recommendations, including the title, type, similarity score (0-1), and description for each.

  Title: {{{title}}}
  Type: {{{type}}}
  Description: {{{description}}}

  Recommendations:`,
});

const recommendSimilarTitlesFlow = ai.defineFlow(
  {
    name: 'recommendSimilarTitlesFlow',
    inputSchema: RecommendSimilarTitlesInputSchema,
    outputSchema: RecommendSimilarTitlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
