// Image Data Types
export interface ImageData {
  uri: string;
  base64?: string | null;
  width: number;
  height: number;
}

// Card Information Types
export interface CardInfo {
  name: string;
  setNumber: string;
  hp: string;
  type: string;
  rarity: string;
  fullText: string;
  setName?: string;
  attacks?: string[];
  weaknesses?: string[];
  retreatCost?: number;
  artist?: string;
  cardNumber?: string;
  totalCards?: string;
  _typeCheck?: 'CardInfo';
}

// Authenticity Check Types
export interface AuthenticityChecks {
  hasName: boolean;
  hasSetNumber: boolean;
  hasHP: boolean;
  fontConsistency: boolean;
  printQuality: boolean;
  holoPattern: boolean;
}

export interface AuthenticityResult {
  isAuthentic: boolean;
  confidence: number;
  issues: string[];
  checks: AuthenticityChecks;
}

// Pokemon TCG API Types
export interface PokemonCard {
  id: string;
  name: string;
  number: string;
  set: {
    name: string;
    series: string;
    printedTotal: number;
  };
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices?: {
      normal?: {
        low: number;
        mid: number;
        high: number;
        market: number;
      };
    };
  };
}

// Updated Pricing Types - Removed TCGPlayer specific types, using generic types
export interface PriceSource {
  source: string;
  cardName: string;
  url: string;
}

export interface TCGPlayerPrice extends PriceSource {
  source: 'TCGPlayer';
  productId: number;
  prices: {
    low: number;
    mid: number;
    high: number;
    market: number;
  };
}

export interface CardKingdomPrice extends PriceSource {
  source: 'Card Kingdom';
  prices: {
    nm: number;  // Near Mint
    lp: number;  // Lightly Played
    mp: number;  // Moderately Played
    hp: number;  // Heavily Played
  };
  inStock: boolean;
}

// Generic price source that can represent any marketplace
export interface GenericPriceSource extends PriceSource {
  source: string;
  prices: Record<string, number>;
  metadata?: Record<string, any>;
}

export type PriceSourceType = TCGPlayerPrice | CardKingdomPrice | GenericPriceSource;

export interface CardPrices {
  cardName: string;
  setNumber: string;
  sources: PriceSourceType[];
  averagePrice?: number;
  gradedPrices?: {
    [grade: string]: number; // e.g., "PSA10": 150.00, "BGS9.5": 120.00
  };
}

// Scan Result Type
export interface ScanResult {
  cardInfo: CardInfo;
  validatedCard: PokemonCard | null;
  authenticity: AuthenticityResult;
  prices: CardPrices | null;
  scanTime: string;
}

// Google Vision API Types
export interface VisionAPIResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
  }>;
}

// App State Types
export interface AppState {
  isScanning: boolean;
  scanResult: ScanResult | null;
  isLoading: boolean;
  error: string | null;
}

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export interface CardData {
  id?: string;
  name: string;
  set: string;
  number?: string;
  rarity: string;
  type?: string;
  hp?: number;
  isAuthentic: boolean;
  condition?: string;
  tcgPlayerPrice?: number;
  ebayPrice?: number;
  imageUri: string;
  imageUrl?: string;
  scannedAt?: string;
  notes?: string;
  tags?: string[];
  releaseDate?: string;
  artist?: string;
  series?: string;
  price?: {
    market?: number;
    low?: number;
    high?: number;
    average?: number;
    psa10?: number; // Added PSA 10 price support
  };
  gradedPrices?: {
    [grade: string]: number; // Support for all graded card prices
  };
}