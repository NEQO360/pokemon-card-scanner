import axios, { AxiosError } from 'axios';
import { 
  CardInfo, 
  PokemonCard, 
  TCGPlayerPrice, 
  CardKingdomPrice, 
  CardPrices 
} from '../types';
import { 
  TCGPLAYER_API_KEY,
  TCGPLAYER_CLIENT_ID,
  TCGPLAYER_CLIENT_SECRET,
  POKEMON_TCG_API_KEY 
} from '@env';
import { getMockTCGPlayerPrice, getMockCardKingdomPrice } from '../utils/mockPriceService';

// Base URLs
const TCGPLAYER_BASE_URL = 'https://api.tcgplayer.com/v1.39.0';
const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

// Check if APIs are configured
const isTCGPlayerConfigured = !!(TCGPLAYER_CLIENT_ID && TCGPLAYER_CLIENT_SECRET);
const isPokemonTCGConfigured = !!POKEMON_TCG_API_KEY;

interface TCGPlayerProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  extendedData?: Array<{
    name: string;
    value: string;
  }>;
}

interface TCGPlayerPriceData {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName: string;
}

export const getTCGPlayerPrice = async (
  cardName: string, 
  setNumber: string,
  rarity?: string
): Promise<TCGPlayerPrice | null> => {
  // If TCGPlayer is not configured, return mock data
  if (!isTCGPlayerConfigured) {
    console.log('📊 Using mock TCGPlayer data (API not configured)');
    return getMockTCGPlayerPrice(cardName, rarity);
  }

  try {
    // Search for the product
    const searchResponse = await axios.get<{
      success: boolean;
      results: TCGPlayerProduct[];
    }>(`${TCGPLAYER_BASE_URL}/catalog/products`, {
      headers: {
        'Authorization': `Bearer ${TCGPLAYER_API_KEY}`,
      },
      params: {
        categoryId: 3, // Pokemon category
        productName: cardName,
        limit: 10,
      },
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return null;
    }

    // Find the matching card by set number if possible
    let product = searchResponse.data.results[0];
    if (setNumber) {
      const matchingProduct = searchResponse.data.results.find(p => 
        p.extendedData?.some(d => 
          d.name === 'Number' && d.value === setNumber
        )
      );
      if (matchingProduct) product = matchingProduct;
    }

    // Get pricing for the product
    const priceResponse = await axios.get<{
      success: boolean;
      results: TCGPlayerPriceData[];
    }>(`${TCGPLAYER_BASE_URL}/pricing/product/${product.productId}`, {
      headers: {
        'Authorization': `Bearer ${TCGPLAYER_API_KEY}`,
      },
    });

    const prices = priceResponse.data.results;
    
    // Extract relevant prices (Normal condition)
    const normalPrices = prices.filter(p => p.subTypeName === 'Normal');
    const priceData = normalPrices[0];
    
    if (!priceData) {
      return null;
    }

    return {
      source: 'TCGPlayer',
      productId: product.productId,
      cardName: product.name,
      prices: {
        low: priceData.lowPrice || 0,
        mid: priceData.midPrice || 0,
        high: priceData.highPrice || 0,
        market: priceData.marketPrice || 0,
      },
      url: `https://www.tcgplayer.com/product/${product.productId}`,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('TCGPlayer API Error:', error.response?.data || error.message);
    } else {
      console.error('TCGPlayer API Error:', error);
    }
    return null;
  }
};

export const getCardKingdomPrice = async (
  cardName: string, 
  setName?: string,
  rarity?: string
): Promise<CardKingdomPrice | null> => {
  try {
    // This is a mock implementation
    // In production, you would need to implement web scraping or use a third-party service
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response for demonstration
    return {
      source: 'Card Kingdom',
      cardName: cardName,
      prices: {
        nm: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        lp: parseFloat((Math.random() * 40 + 8).toFixed(2)),
        mp: parseFloat((Math.random() * 30 + 6).toFixed(2)),
        hp: parseFloat((Math.random() * 20 + 4).toFixed(2)),
      },
      inStock: Math.random() > 0.3,
      url: `https://www.cardkingdom.com/pokemon/${cardName.toLowerCase().replace(/\s+/g, '-')}`,
    };
  } catch (error) {
    console.error('Card Kingdom Price Error:', error);
    return null;
  }
};

export const getCardPrices = async (cardInfo: CardInfo): Promise<CardPrices | null> => {
  try {
    const [tcgPlayerPrice, cardKingdomPrice] = await Promise.all([
      getTCGPlayerPrice(cardInfo.name, cardInfo.setNumber, cardInfo.rarity),
      getCardKingdomPrice(cardInfo.name, cardInfo.setName, cardInfo.rarity),
    ]);

    const prices: CardPrices = {
      cardName: cardInfo.name,
      setNumber: cardInfo.setNumber,
      sources: [],
    };

    if (tcgPlayerPrice) {
      prices.sources.push(tcgPlayerPrice);
    }

    if (cardKingdomPrice) {
      prices.sources.push(cardKingdomPrice);
    }

    // Calculate average market price
    if (prices.sources.length > 0) {
      const marketPrices: number[] = [];
      
      prices.sources.forEach(source => {
        if (source.source === 'TCGPlayer') {
          marketPrices.push(source.prices.market);
        } else if (source.source === 'Card Kingdom') {
          marketPrices.push(source.prices.nm);
        }
      });
      
      const validPrices = marketPrices.filter(p => p > 0);
      prices.averagePrice = validPrices.length > 0
        ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
        : 0;
    }

    return prices;
  } catch (error) {
    console.error('Price aggregation error:', error);
    return null;
  }
};

interface PokemonAPIResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

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