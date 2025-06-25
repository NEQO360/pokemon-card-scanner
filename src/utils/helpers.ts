import { COLORS, AUTHENTICITY_THRESHOLDS, CARD_CONDITIONS } from './constants';
import { AuthenticityResult, CardCondition } from '../types';

// Format currency values
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Get authenticity color based on confidence
export const getAuthenticityColor = (authenticity: AuthenticityResult): string => {
  if (authenticity.confidence >= AUTHENTICITY_THRESHOLDS.HIGH_CONFIDENCE) {
    return COLORS.success;
  } else if (authenticity.confidence >= AUTHENTICITY_THRESHOLDS.MEDIUM_CONFIDENCE) {
    return COLORS.warning;
  } else {
    return COLORS.error;
  }
};

// Get authenticity text based on confidence
export const getAuthenticityText = (authenticity: AuthenticityResult): string => {
  if (authenticity.confidence >= AUTHENTICITY_THRESHOLDS.HIGH_CONFIDENCE) {
    return 'Highly Likely Authentic';
  } else if (authenticity.confidence >= AUTHENTICITY_THRESHOLDS.MEDIUM_CONFIDENCE) {
    return 'Possibly Authentic';
  } else {
    return 'Likely Fake';
  }
};

// Calculate price trend
export const calculatePriceTrend = (
  currentPrice: number,
  previousPrice: number
): { percentage: number; trend: 'up' | 'down' | 'stable' } => {
  if (previousPrice === 0) return { percentage: 0, trend: 'stable' };
  
  const percentage = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  if (percentage > 1) return { percentage, trend: 'up' };
  if (percentage < -1) return { percentage: Math.abs(percentage), trend: 'down' };
  return { percentage: 0, trend: 'stable' };
};

// Get condition display text
export const getConditionText = (condition: CardCondition): string => {
  return CARD_CONDITIONS[condition] || condition;
};

// Estimate card value based on condition
export const estimateValueByCondition = (
  nmPrice: number,
  condition: CardCondition
): number => {
  const conditionMultipliers: Record<CardCondition, number> = {
    NM: 1.0,
    LP: 0.85,
    MP: 0.65,
    HP: 0.45,
    DMG: 0.25,
  };
  
  return nmPrice * (conditionMultipliers[condition] || 0.5);
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

// Validate card set number format
export const isValidSetNumber = (setNumber: string): boolean => {
  return /^\d+\/\d+$/.test(setNumber);
};

// Extract card number from set number (e.g., "25/102" -> "25")
export const extractCardNumber = (setNumber: string): string | null => {
  const match = setNumber.match(/^(\d+)\/\d+$/);
  return match ? match[1] : null;
};

// Generate unique card ID
export const generateCardId = (cardName: string, setNumber: string): string => {
  const sanitizedName = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedNumber = setNumber.replace(/\//g, '-');
  return `${sanitizedName}-${sanitizedNumber}`;
};

// Check if price is considered a good deal
export const isGoodDeal = (
  currentPrice: number,
  marketPrice: number,
  threshold: number = 0.15
): boolean => {
  return currentPrice <= marketPrice * (1 - threshold);
};

// Format large numbers
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Calculate collection value
export const calculateCollectionValue = (
  cards: Array<{ price: number; quantity: number }>
): number => {
  return cards.reduce((total, card) => total + (card.price * card.quantity), 0);
};

// Get rarity color
export const getRarityColor = (rarity: string): string => {
  const rarityColors: Record<string, string> = {
    'Common': '#858585',
    'Uncommon': '#4A90E2',
    'Rare': '#F5A623',
    'Rare Holo': '#BD10E0',
    'Rare Ultra': '#E91E63',
    'Rare Secret': '#FF6B6B',
    'Rare Rainbow': '#9C27B0',
    'Rare Gold': '#FFD700',
  };
  
  return rarityColors[rarity] || COLORS.text;
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};