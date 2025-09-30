import { PlaceHolderImages } from "./placeholder-images";
import type { TitleInfo } from "./types";

const coverImage = PlaceHolderImages.find(img => img.id === 'anime-cover');

export const mockTitle: TitleInfo = {
    id: '1',
    title: 'Solo Leveling',
    type: 'anime',
    description: 'In a world where hunters, humans with supernatural abilities, must battle deadly monsters to protect mankind, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after a brutal encounter in a hidden dungeon, he is chosen by a mysterious program called the System, which grants him the unique ability to grow in strength without limit. Follow Jinwoo’s journey as he rises from the weakest hunter to the strongest in existence.',
    imageUrl: coverImage?.imageUrl ?? 'https://picsum.photos/seed/sololeveling/400/600',
    imageHint: coverImage?.imageHint ?? 'anime cover art',
    rating: 9.2,
    ranking: 1,
    commentsCount: 12500,
    listsCount: 35000,
}
