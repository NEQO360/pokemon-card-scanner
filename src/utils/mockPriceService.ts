import { TCGPlayerPrice, CardKingdomPrice } from '../types';

// Mock price data for testing/demo purposes
const MOCK_PRICE_RANGES: Record<string, { low: number; mid: number; high: number }> = {
  common: { low: 0.25, mid: 0.50, high: 1.00 },
  uncommon: { low: 0.50, mid: 1.00, high: 2.00 },
  rare: { low: 2.00, mid: 5.00, high: 10.00 },
  'rare holo': { low: 5.00, mid: 15.00, high: 30.00 },
  'ultra rare': { low: 20.00, mid: 50.00, high: 100.00 },
};

export const getMockTCGPlayerPrice = (cardName: string, rarity?: string): TCGPlayerPrice => {
  const priceRange = MOCK_PRICE_RANGES[rarity?.toLowerCase() || 'rare'] || MOCK_PRICE_RANGES.rare;
  
  // Add some randomness to make it seem more realistic
  const randomMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  return {
    source: 'TCGPlayer',
    productId: Math.floor(Math.random() * 100000),
    cardName: cardName,
    prices: {
      low: Number((priceRange.low * randomMultiplier).toFixed(2)),
      mid: Number((priceRange.mid * randomMultiplier).toFixed(2)),
      high: Number((priceRange.high * randomMultiplier).toFixed(2)),
      market: Number((priceRange.mid * randomMultiplier).toFixed(2)),
    },
    url: `https://www.tcgplayer.com/search/pokemon/product?productName=${encodeURIComponent(cardName)}`,
  };
};

export const getMockCardKingdomPrice = (cardName: string, rarity?: string): CardKingdomPrice => {
  const tcgPrice = getMockTCGPlayerPrice(cardName, rarity);
  
  // Card Kingdom prices are usually slightly different from TCGPlayer
  const priceAdjustment = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
  
  return {
    source: 'Card Kingdom',
    cardName: cardName,
    prices: {
      nm: Number((tcgPrice.prices.market * priceAdjustment).toFixed(2)),
      lp: Number((tcgPrice.prices.market * priceAdjustment * 0.85).toFixed(2)),
      mp: Number((tcgPrice.prices.market * priceAdjustment * 0.65).toFixed(2)),
      hp: Number((tcgPrice.prices.market * priceAdjustment * 0.45).toFixed(2)),
    },
    inStock: Math.random() > 0.2, // 80% chance of being in stock
    url: `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${encodeURIComponent(cardName)}`,
  };
};

// Generate realistic looking historical price data
export const getMockPriceHistory = (currentPrice: number, days: number = 30) => {
  const history = [];
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    // Random walk with slight upward trend
    const change = (Math.random() - 0.48) * 0.1; // Slight bias upward
    price = Math.max(0.01, price * (1 + change));
    
    history.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      price: Number(price.toFixed(2)),
    });
  }
  
  return history;
};

// Estimate price based on card attributes
export const estimateCardValue = (
  cardName: string,
  rarity?: string,
  isHolo?: boolean,
  condition: string = 'NM'
): number => {
  let basePrice = 5.00; // Default price
  
  // Adjust based on rarity
  const rarityMultipliers: Record<string, number> = {
    common: 0.1,
    uncommon: 0.3,
    rare: 1,
    'rare holo': 3,
    'ultra rare': 10,
    'secret rare': 20,
  };
  
  const rarityMultiplier = rarityMultipliers[rarity?.toLowerCase() || 'rare'] || 1;
  basePrice *= rarityMultiplier;
  
  // Adjust for holo
  if (isHolo) {
    basePrice *= 2;
  }
  
  // Adjust for popular Pokemon
  const popularPokemon = ['charizard', 'pikachu', 'mewtwo', 'rayquaza', 'umbreon', 'gengar'];
  if (popularPokemon.some(pokemon => cardName.toLowerCase().includes(pokemon))) {
    basePrice *= 3;
  }
  
  // Adjust for condition
  const conditionMultipliers: Record<string, number> = {
    NM: 1,
    LP: 0.85,
    MP: 0.65,
    HP: 0.45,
    DMG: 0.25,
  };
  
  basePrice *= conditionMultipliers[condition] || 1;
  
  // Add some randomness
  basePrice *= (0.8 + Math.random() * 0.4);
  
  return Number(basePrice.toFixed(2));
};