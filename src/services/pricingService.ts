import axios, { AxiosError } from 'axios';
import { 
  CardInfo, 
  PokemonCard, 
  CardPrices 
} from '../types';
import { POKEMON_TCG_API_KEY } from '@env';
import { 
  searchCardsByName, 
  searchCardsBySetAndNumber,
  getBestMarketPrice,
  formatCardPrices,
  PokemonPriceTrackerCard 
} from './pokemonPriceTrackerService';
import { getMockTCGPlayerPrice, getMockCardKingdomPrice } from '../utils/mockPriceService';

// Base URLs
const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Check if APIs are configured
const isPokemonTCGConfigured = !!POKEMON_TCG_API_KEY;
const useMockData = !isPokemonTCGConfigured;

/**
 * Get pricing data from Pokemon Price Tracker
 */
export const getPokemonPriceTrackerData = async (
  cardName: string, 
  setNumber?: string,
  setName?: string
): Promise<CardPrices | null> => {
  try {
    console.log(`🔍 Searching for card: ${cardName}${setNumber ? ` (${setNumber})` : ''}`);
    
    // First, try to search by name
    let cards = await searchCardsByName(cardName, 10);
    
    if (cards.length === 0) {
      console.log('📝 No cards found by name, using mock data');
      return createMockPriceData(cardName, setNumber);
    }

    // If we have a set number, try to find the exact match
    let bestMatch: PokemonPriceTrackerCard | null = null;
    
    if (setNumber) {
      // Extract card number from set number (e.g., "25/102" -> "25")
      const cardNumber = setNumber.split('/')[0];
      
      // Try to find exact match by card number
      bestMatch = cards.find(card => 
        card.number === cardNumber || 
        card.number === setNumber ||
        card.id.includes(cardNumber)
      ) || null;
      
      // If no exact match and we have set info, try searching by set
      if (!bestMatch && setName) {
        const setCards = await searchCardsBySetAndNumber(
          inferSetId(setName), 
          cardNumber
        );
        if (setCards.length > 0) {
          bestMatch = setCards[0];
        }
      }
    }

    // If no specific match found, use the first result
    if (!bestMatch && cards.length > 0) {
      bestMatch = cards[0];
    }

    if (!bestMatch) {
      console.log('📝 No suitable match found, using mock data');
      return createMockPriceData(cardName, setNumber);
    }

    console.log(`✅ Found match: ${bestMatch.name} (${bestMatch.setName})`);

    // Format the pricing data
    const marketPrice = getBestMarketPrice(bestMatch);
    const allPrices = formatCardPrices(bestMatch);

    const cardPrices: CardPrices = {
      cardName: bestMatch.name,
      setNumber: setNumber || bestMatch.number,
      sources: [],
      averagePrice: marketPrice || undefined,
    };

    // Add TCGPlayer data if available
    if (allPrices.tcgplayer) {
      cardPrices.sources.push({
        source: 'TCGPlayer',
        productId: 0, // Not provided by Pokemon Price Tracker
        cardName: bestMatch.name,
        prices: {
          low: allPrices.tcgplayer.low,
          mid: allPrices.tcgplayer.mid,
          high: allPrices.tcgplayer.high,
          market: allPrices.tcgplayer.market,
        },
        url: bestMatch.tcgplayer?.url || `https://www.tcgplayer.com/search/pokemon/product?productName=${encodeURIComponent(bestMatch.name)}`,
      });
    }

    // Add CardMarket data if available
    if (allPrices.cardmarket) {
      cardPrices.sources.push({
        source: 'Card Kingdom', // Using Card Kingdom type for CardMarket data
        cardName: bestMatch.name,
        prices: {
          nm: allPrices.cardmarket.market,
          lp: allPrices.cardmarket.market * 0.85,
          mp: allPrices.cardmarket.market * 0.65,
          hp: allPrices.cardmarket.market * 0.45,
        },
        inStock: true,
        url: bestMatch.cardmarket?.url || `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(bestMatch.name)}`,
      });
    }

    return cardPrices;

  } catch (error) {
    console.error('Pokemon Price Tracker error:', error);
    return createMockPriceData(cardName, setNumber);
  }
};

/**
 * Create mock price data when API is unavailable
 */
const createMockPriceData = (cardName: string, setNumber?: string): CardPrices => {
  console.log('📝 Using mock price data');
  
  const mockTCGPlayer = getMockTCGPlayerPrice(cardName);
  const mockCardKingdom = getMockCardKingdomPrice(cardName);

  return {
    cardName,
    setNumber: setNumber || 'unknown',
    sources: [mockTCGPlayer, mockCardKingdom],
    averagePrice: (mockTCGPlayer.prices.market + mockCardKingdom.prices.nm) / 2,
  };
};

/**
 * Helper function to infer set ID from set name
 * This is a basic implementation - you may need to expand this based on actual set mappings
 */
const inferSetId = (setName: string): string => {
  const setMappings: Record<string, string> = {
    'Base Set': 'base1',
    'Jungle': 'jungle',
    'Fossil': 'fossil',
    'Team Rocket': 'team-rocket',
    'Gym Heroes': 'gym-heroes',
    'Gym Challenge': 'gym-challenge',
    'Neo Genesis': 'neo-genesis',
    'Neo Discovery': 'neo-discovery',
    'Neo Destiny': 'neo-destiny',
    'Neo Revelation': 'neo-revelation',
    'Legendary Collection': 'legendary-collection',
    'Expedition': 'expedition',
    'Aquapolis': 'aquapolis',
    'Skyridge': 'skyridge',
    'Ruby & Sapphire': 'ruby-sapphire',
    'Sandstorm': 'sandstorm',
    'Dragon': 'dragon',
    'Team Magma vs Team Aqua': 'team-magma-vs-team-aqua',
    'Hidden Fates': 'hidden-fates',
    'Shining Fates': 'shining-fates',
    'Battle Styles': 'battle-styles',
    'Chilling Reign': 'chilling-reign',
    'Evolving Skies': 'evolving-skies',
    'Fusion Strike': 'fusion-strike',
    'Brilliant Stars': 'brilliant-stars',
    'Astral Radiance': 'astral-radiance',
    'Lost Origin': 'lost-origin',
    'Silver Tempest': 'silver-tempest',
    'Crown Zenith': 'crown-zenith',
    'Scarlet & Violet': 'sv1',
    'Paldea Evolved': 'sv2',
    'Obsidian Flames': 'sv3',
    'Paradox Rift': 'sv4',
    'Paldean Fates': 'sv4.5',
    'Temporal Forces': 'sv5',
  };

  return setMappings[setName] || setName.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

/**
 * Main function to get card prices - replaces the old getCardPrices
 */
export const getCardPrices = async (cardInfo: CardInfo): Promise<CardPrices | null> => {
  try {
    // Use Pokemon Price Tracker as primary source
    const priceData = await getPokemonPriceTrackerData(
      cardInfo.name, 
      cardInfo.setNumber, 
      cardInfo.setName
    );

    if (priceData && priceData.sources.length > 0) {
      return priceData;
    }

    // Fallback to mock data
    console.log('📝 Falling back to mock price data');
    return createMockPriceData(cardInfo.name, cardInfo.setNumber);

  } catch (error) {
    console.error('Price aggregation error:', error);
    return createMockPriceData(cardInfo.name, cardInfo.setNumber);
  }
};

interface PokemonAPIResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

/**
 * Validate card with Pokemon TCG API (unchanged)
 */
export const validateCardWithPokemonAPI = async (
  cardName: string, 
  setNumber?: string
): Promise<PokemonCard | null> => {
  try {
    const response = await axios.get<PokemonAPIResponse>(
      `${POKEMON_TCG_API_BASE}/cards`,
      {
        params: {
          q: `name:"${cardName}"`,
          pageSize: 10,
        },
        headers: {
          'X-Api-Key': POKEMON_TCG_API_KEY || '', // API key is optional but increases rate limit
        },
      }
    );

    if (response.data.data.length === 0) {
      return null;
    }

    // Find exact match or closest match
    let matchedCard = response.data.data[0];
    
    if (setNumber) {
      const cardNumber = setNumber.split('/')[0];
      const exactMatch = response.data.data.find(card => 
        card.number === cardNumber
      );
      if (exactMatch) matchedCard = exactMatch;
    }

    return matchedCard;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Pokemon API Error:', error.response?.data || error.message);
    } else {
      console.error('Pokemon API Error:', error);
    }
    return null;
  }
};

// Helper function to format price display
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

// Helper function to determine if a price is considered good
export const isPriceGood = (currentPrice: number, marketPrice: number): boolean => {
  return currentPrice <= marketPrice * 0.9; // 10% or more below market
};