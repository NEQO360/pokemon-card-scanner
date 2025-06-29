import axios, { AxiosError } from 'axios';
import { POKEMON_PRICE_TRACKER_API_KEY } from '@env';

// Base URL for Pokemon Price Tracker API
const POKEMON_PRICE_TRACKER_BASE_URL = 'https://www.pokemonpricetracker.com/api/v1';

// Check if API is configured
const isPokemonPriceTrackerConfigured = !!POKEMON_PRICE_TRACKER_API_KEY;

console.log('🔑 Pokemon Price Tracker API Key status:', 
  POKEMON_PRICE_TRACKER_API_KEY ? `Set (${POKEMON_PRICE_TRACKER_API_KEY.substring(0, 10)}...)` : 'Not set'
);

// Types for Pokemon Price Tracker API
export interface PokemonPriceTrackerCard {
  id: string;
  name: string;
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  tcgplayer?: {
    prices: {
      low: number;
      mid: number;
      high: number;
      market: number;
    };
    url?: string;
  };
  cardmarket?: {
    prices: {
      low: number;
      mid: number;
      high: number;
      market: number;
    };
    url?: string;
  };
  ebay?: {
    prices: {
      [grade: string]: number; // e.g., "PSA10": 150.00, "BGS9.5": 120.00, "raw": 25.00
    };
  };
  image?: string;
  lastUpdated: string;
}

export interface PokemonPriceTrackerSet {
  id: string;
  name: string;
  releaseDate?: string;
}

export interface PokemonPriceTrackerResponse {
  data: PokemonPriceTrackerCard[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PokemonPriceTrackerSetsResponse {
  data: PokemonPriceTrackerSet[];
}

// Create axios instance with default config
const createApiClient = () => {
  if (!isPokemonPriceTrackerConfigured) {
    throw new Error('Pokemon Price Tracker API key not configured');
  }

  return axios.create({
    baseURL: POKEMON_PRICE_TRACKER_BASE_URL,
    headers: {
      'Authorization': `Bearer ${POKEMON_PRICE_TRACKER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Search for cards by name
 */
export const searchCardsByName = async (
  cardName: string,
  limit: number = 10
): Promise<PokemonPriceTrackerCard[]> => {
  if (!isPokemonPriceTrackerConfigured) {
    console.warn('⚠️ Pokemon Price Tracker API not configured, cannot search cards');
    return [];
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get<PokemonPriceTrackerResponse>('/prices', {
      params: {
        name: cardName,
        limit,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Pokemon Price Tracker search error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    return [];
  }
};

/**
 * Get card by specific ID
 */
export const getCardById = async (cardId: string): Promise<PokemonPriceTrackerCard | null> => {
  if (!isPokemonPriceTrackerConfigured) {
    console.warn('⚠️ Pokemon Price Tracker API not configured, cannot get card');
    return null;
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get<PokemonPriceTrackerResponse>('/prices', {
      params: {
        id: cardId,
      },
    });

    const cards = response.data.data || [];
    return cards.length > 0 ? cards[0] : null;
  } catch (error) {
    console.error('Pokemon Price Tracker get card error:', error);
    return null;
  }
};

/**
 * Search for cards by set and number
 */
export const searchCardsBySetAndNumber = async (
  setId: string,
  cardNumber: string
): Promise<PokemonPriceTrackerCard[]> => {
  if (!isPokemonPriceTrackerConfigured) {
    console.warn('⚠️ Pokemon Price Tracker API not configured, cannot search by set');
    return [];
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get<PokemonPriceTrackerResponse>('/prices', {
      params: {
        setId,
        number: cardNumber,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Pokemon Price Tracker set search error:', error);
    return [];
  }
};

/**
 * Get all available sets
 */
export const getAllSets = async (): Promise<PokemonPriceTrackerSet[]> => {
  if (!isPokemonPriceTrackerConfigured) {
    console.warn('⚠️ Pokemon Price Tracker API not configured, cannot get sets');
    return [];
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get<PokemonPriceTrackerSetsResponse>('/sets');

    return response.data.data || [];
  } catch (error) {
    console.error('Pokemon Price Tracker sets error:', error);
    return [];
  }
};

/**
 * Get cards from a specific set
 */
export const getCardsFromSet = async (
  setId: string,
  limit: number = 50,
  page: number = 1
): Promise<PokemonPriceTrackerCard[]> => {
  if (!isPokemonPriceTrackerConfigured) {
    console.warn('⚠️ Pokemon Price Tracker API not configured, cannot get set cards');
    return [];
  }

  try {
    const apiClient = createApiClient();
    const response = await apiClient.get<PokemonPriceTrackerResponse>('/prices', {
      params: {
        setId,
        limit,
        page,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Pokemon Price Tracker set cards error:', error);
    return [];
  }
};

/**
 * Helper function to get the best market price from multiple sources
 */
export const getBestMarketPrice = (card: PokemonPriceTrackerCard): number | null => {
  const prices: number[] = [];

  // Add TCGPlayer market price
  if (card.tcgplayer?.prices?.market) {
    prices.push(card.tcgplayer.prices.market);
  }

  // Add CardMarket price
  if (card.cardmarket?.prices?.market) {
    prices.push(card.cardmarket.prices.market);
  }

  // Add eBay raw (ungraded) price
  if (card.ebay?.prices?.raw) {
    prices.push(card.ebay.prices.raw);
  }

  // Return average of available prices
  if (prices.length === 0) return null;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
};

/**
 * Helper function to get PSA 10 price if available
 */
export const getPSA10Price = (card: PokemonPriceTrackerCard): number | null => {
  return card.ebay?.prices?.PSA10 || null;
};

/**
 * Helper function to format all available prices
 */
export const formatCardPrices = (card: PokemonPriceTrackerCard) => {
  return {
    tcgplayer: card.tcgplayer?.prices || null,
    cardmarket: card.cardmarket?.prices || null,
    ebay: card.ebay?.prices || null,
    marketPrice: getBestMarketPrice(card),
    psa10Price: getPSA10Price(card),
  };
};