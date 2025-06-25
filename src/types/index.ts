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

// Pricing Types
export interface TCGPlayerPrice {
  source: 'TCGPlayer';
  productId: number;
  cardName: string;
  prices: {
    low: number;
    mid: number;
    high: number;
    market: number;
  };
  url: string;
}

export interface CardKingdomPrice {
  source: 'Card Kingdom';
  cardName: string;
  prices: {
    nm: number;  // Near Mint
    lp: number;  // Lightly Played
    mp: number;  // Moderately Played
    hp: number;  // Heavily Played
  };
  inStock: boolean;
  url: string;
}

export type PriceSource = TCGPlayerPrice | CardKingdomPrice;

export interface CardPrices {
  cardName: string;
  setNumber: string;
  sources: PriceSource[];
  averagePrice?: number;
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