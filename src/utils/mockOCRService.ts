import { CardInfo } from '../types';

// Common Pokemon card names for realistic mock data
const POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle', 'Mewtwo', 
  'Rayquaza', 'Umbreon', 'Gengar', 'Dragonite', 'Lucario',
  'Eevee', 'Snorlax', 'Garchomp', 'Tyranitar', 'Blastoise'
];

const SETS = [
  'Base Set', 'Jungle', 'Fossil', 'Team Rocket', 'Gym Heroes',
  'Neo Genesis', 'Aquapolis', 'Hidden Fates', 'Shining Fates',
  'Evolving Skies', 'Battle Styles', 'Fusion Strike'
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare'];

const TYPES = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Dark', 'Steel', 'Dragon', 'Fairy'];

// Generate mock card info based on image analysis
export const generateMockCardInfo = (): CardInfo => {
  const randomPokemon = POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)];
  const randomSet = SETS[Math.floor(Math.random() * SETS.length)];
  const randomRarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
  const randomType = TYPES[Math.floor(Math.random() * TYPES.length)];
  
  const cardNumber = Math.floor(Math.random() * 200) + 1;
  const totalCards = Math.floor(Math.random() * 100) + 200;
  const hp = Math.floor(Math.random() * 20) * 10 + 30; // 30-230 HP
  
  const cardInfo: CardInfo = {
      name: randomPokemon,
      setNumber: `${cardNumber}/${totalCards}`,
      setName: randomSet,
      rarity: randomRarity,
      type: randomType,
      hp: hp.toString(),
      attacks: [
          `${randomType} Blast`,
          'Quick Attack'
      ],
      weaknesses: [getWeakness(randomType)],
      retreatCost: Math.floor(Math.random() * 4) + 1,
      artist: 'Ken Sugimori',
      cardNumber: cardNumber.toString(),
      totalCards: totalCards.toString(),
      fullText: ''
  };
  
  return cardInfo;
};

// Get Pokemon type weakness
const getWeakness = (type: string): string => {
  const weaknessMap: Record<string, string> = {
    'Fire': 'Water',
    'Water': 'Electric',
    'Grass': 'Fire',
    'Electric': 'Ground',
    'Psychic': 'Dark',
    'Fighting': 'Psychic',
    'Dark': 'Fighting',
    'Steel': 'Fire',
    'Dragon': 'Fairy',
    'Fairy': 'Steel',
  };
  
  return weaknessMap[type] || 'Fighting';
};

// Simulate OCR processing with delay
export const mockExtractTextFromImage = async (base64Image: string): Promise<CardInfo> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real scenario, you might analyze the image brightness, size, etc.
  // For now, we'll just return random mock data
  console.log('📸 Using mock OCR data (Google Vision API not configured)');
  
  return generateMockCardInfo();
};

// Generate mock authenticity issues based on card info
export const generateMockAuthenticityIssues = (cardInfo: CardInfo): string[] => {
  const issues: string[] = [];
  
  // Randomly generate some issues (70% chance of being authentic)
  if (Math.random() > 0.7) {
    const possibleIssues = [
      'Font spacing appears inconsistent',
      'Holographic pattern may be incorrect',
      'Card thickness seems off',
      'Color saturation is unusual',
      'Border alignment is slightly off',
      'Energy symbols look suspicious',
      'Set symbol appears modified'
    ];
    
    // Add 1-3 random issues
    const numIssues = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numIssues; i++) {
      const randomIssue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
      if (!issues.includes(randomIssue)) {
        issues.push(randomIssue);
      }
    }
  }
  
  return issues;
};