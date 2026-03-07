export interface Interest {
  key: string;
  category: string;
  emoji: string;
}

export const INTERESTS_BY_CATEGORY: Record<string, Interest[]> = {
  lifestyle: [
    { key: 'interestTravel', category: 'lifestyle', emoji: '✈️' },
    { key: 'interestFood', category: 'lifestyle', emoji: '🍴' },
    { key: 'interestNature', category: 'lifestyle', emoji: '🌳' },
    { key: 'interestCooking', category: 'lifestyle', emoji: '🍳' },
    { key: 'interestFashion', category: 'lifestyle', emoji: '👗' },
  ],
  hobbiesArts: [
    { key: 'interestPhotography', category: 'hobbiesArts', emoji: '📸' },
    { key: 'interestMusic', category: 'hobbiesArts', emoji: '🎵' },
    { key: 'interestArt', category: 'hobbiesArts', emoji: '🎨' },
    { key: 'interestBooks', category: 'hobbiesArts', emoji: '📚' },
    { key: 'interestMovies', category: 'hobbiesArts', emoji: '🎬' },
    { key: 'interestDance', category: 'hobbiesArts', emoji: '💃' },
  ],
  sports: [
    { key: 'interestSport', category: 'sports', emoji: '⚽' },
    { key: 'interestYoga', category: 'sports', emoji: '🧘' },
    { key: 'interestVolleyball', category: 'sports', emoji: '🏐' },
    { key: 'interestFootball', category: 'sports', emoji: '⚽' },
    { key: 'interestBasketball', category: 'sports', emoji: '🏀' },
    { key: 'interestRunning', category: 'sports', emoji: '🏃' },
    { key: 'interestCycling', category: 'sports', emoji: '🚴' },
    { key: 'interestSwimming', category: 'sports', emoji: '🏊' },
    { key: 'interestFitness', category: 'sports', emoji: '💪' },
    { key: 'interestMeditation', category: 'sports', emoji: '🧘‍♀️' },
  ],
  tech: [
    { key: 'interestGames', category: 'tech', emoji: '🎮' },
    { key: 'interestTech', category: 'tech', emoji: '💻' },
  ],
};

export const ALL_INTERESTS = Object.values(INTERESTS_BY_CATEGORY).flat();

export const getInterestByKey = (key: string): Interest | undefined => {
  return ALL_INTERESTS.find((interest) => interest.key === key);
};
