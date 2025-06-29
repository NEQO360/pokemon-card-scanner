// API Keys - Move these to environment variables in production
export const API_KEYS = {
  GOOGLE_VISION: process.env.GOOGLE_VISION_API_KEY || 'YOUR_GOOGLE_VISION_API_KEY',
  POKEMON_TCG: process.env.POKEMON_TCG_API_KEY || 'YOUR_POKEMON_TCG_API_KEY',
  POKEMON_PRICE_TRACKER: process.env.POKEMON_PRICE_TRACKER_API_KEY || 'YOUR_POKEMON_PRICE_TRACKER_API_KEY',
};

// API Endpoints
export const API_ENDPOINTS = {
  GOOGLE_VISION: 'https://vision.googleapis.com/v1/images:annotate',
  POKEMON_TCG_BASE: 'https://api.pokemontcg.io/v2',
  POKEMON_PRICE_TRACKER_BASE: 'https://www.pokemonpricetracker.com/api/v1',
  CARD_KINGDOM_BASE: 'https://www.cardkingdom.com',
};

// Pokemon Types
export const POKEMON_TYPES = [
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Psychic',
  'Fighting',
  'Dark',
  'Steel',
  'Fairy',
  'Dragon',
  'Normal',
  'Colorless',
] as const;

export type PokemonType = typeof POKEMON_TYPES[number];

// Card Rarities
export const CARD_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Rare Holo',
  'Rare Ultra',
  'Rare Secret',
  'Rare Rainbow',
  'Rare Gold',
] as const;

export type CardRarity = typeof CARD_RARITIES[number];

// Card Conditions
export const CARD_CONDITIONS = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
} as const;

export type CardCondition = keyof typeof CARD_CONDITIONS;

// Card Grading Services
export const GRADING_SERVICES = {
  PSA: 'Professional Sports Authenticator',
  BGS: 'Beckett Grading Services',
  CGC: 'Certified Guaranty Company',
  SGC: 'Sportscard Guaranty',
} as const;

export type GradingService = keyof typeof GRADING_SERVICES;

// Common PSA/BGS grades
export const COMMON_GRADES = [
  'PSA10', 'PSA9', 'PSA8', 'PSA7',
  'BGS10', 'BGS9.5', 'BGS9', 'BGS8.5', 'BGS8',
  'CGC10', 'CGC9.5', 'CGC9', 'CGC8.5',
  'SGC10', 'SGC9.5', 'SGC9', 'SGC8.5'
] as const;

// Authenticity Thresholds
export const AUTHENTICITY_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4,
};

// Image Processing Settings
export const IMAGE_SETTINGS = {
  QUALITY: 0.7,
  MAX_WIDTH: 1000,
  MAX_HEIGHT: 1000,
  ASPECT_RATIO: [3, 4] as [number, number],
};

// Cache Settings
export const CACHE_SETTINGS = {
  PRICE_CACHE_DURATION: 3600000, // 1 hour in milliseconds
  CARD_DATA_CACHE_DURATION: 86400000, // 24 hours in milliseconds
};

// Error Messages
export const ERROR_MESSAGES = {
  CAMERA_PERMISSION: 'Camera permission is required to scan cards',
  IMAGE_CAPTURE: 'Failed to capture image. Please try again.',
  OCR_FAILED: 'Could not read card information. Please ensure good lighting and focus.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  API_ERROR: 'Service temporarily unavailable. Please try again later.',
  CARD_NOT_FOUND: 'Card not found in database. It may be a custom or proxy card.',
  PRICE_UNAVAILABLE: 'Price information currently unavailable.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CARD_SAVED: 'Card saved to collection!',
  CARD_UPDATED: 'Card information updated!',
  CARD_DELETED: 'Card removed from collection.',
};

// Regular Expressions
export const REGEX_PATTERNS = {
  SET_NUMBER: /(\d+)\/(\d+)/,
  HP_PATTERN: /(\w+.*?)\s+(?:HP\s*)?(\d+)\s*HP/i,
  PRICE_PATTERN: /\$?(\d+\.?\d*)/,
  CARD_NUMBER: /^[A-Z0-9]+-\d+$/i,
};

// Colors
export const COLORS = {
  primary: '#3b4cca',
  secondary: '#ff6b6b',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#d32f2f',
  authentic: '#2e7d2e',
  fake: '#d32f2f',
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
};

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  IMAGE_PROCESSING: 60000, // 60 seconds
  CACHE_CLEANUP: 3600000, // 1 hour
};