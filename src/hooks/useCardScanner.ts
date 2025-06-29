import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ScanResult, CardInfo, CardData, ImageData, TCGPlayerPrice, CardKingdomPrice, CardPrices } from '../types';
import { extractTextFromImage, verifyCardAuthenticity } from '../services/ocrService';
import { getCardPrices, validateCardWithPokemonAPI } from '../services/pricingService';
import { ERROR_MESSAGES } from '../utils/constants';

interface UseCardScannerParams {
  onSuccess?: (cardData: CardData) => void;
  onError?: (error: string) => void;
}

interface UseCardScannerReturn {
  scanResult: ScanResult | null;
  isScanning: boolean;
  progress: number;
  currentStep: number;
  steps: string[];
  error: string | null;
  scanCard: (imageData: ImageData) => Promise<void>;
  resetScan: () => void;
  clearError: () => void;
}

const SCAN_STEPS = [
  'Extracting text from image...',
  'Validating card information...',
  'Checking authenticity...',
  'Fetching market prices...'
];

/**
 * Helper function to extract market price from different price source types
 */
const extractMarketPrice = (source: any): number | null => {
  if (!source || !source.prices) return null;
  
  if (source.source === 'TCGPlayer' && 'market' in source.prices) {
    return source.prices.market;
  }
  if (source.source === 'Card Kingdom' && 'nm' in source.prices) {
    return source.prices.nm; // Use Near Mint price as market price
  }
  // For generic price sources, try to find a reasonable market price
  if (typeof source.prices === 'object') {
    // Try common price keys
    return source.prices.market || 
           source.prices.mid || 
           source.prices.average || 
           source.prices.nm ||
           null;
  }
  return null;
};

/**
 * Helper function to get the best available price from price sources
 */
const getBestAvailablePrice = (priceData: CardPrices | null): number | null => {
  if (!priceData || !priceData.sources || priceData.sources.length === 0) {
    return null;
  }

  // First try to use the pre-calculated average price
  if (priceData.averagePrice && priceData.averagePrice > 0) {
    return priceData.averagePrice;
  }

  // Otherwise extract from individual sources
  const prices: number[] = [];
  
  for (const source of priceData.sources) {
    const price = extractMarketPrice(source);
    if (price && price > 0) {
      prices.push(price);
    }
  }

  if (prices.length === 0) return null;
  
  // Return average of available prices
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
};

/**
 * Helper function to get TCGPlayer specific price
 */
const getTCGPlayerPrice = (priceData: CardPrices | null): number | null => {
  if (!priceData || !priceData.sources) return null;
  
  const tcgPlayerSource = priceData.sources.find((source) => 
    source.source === 'TCGPlayer'
  ) as TCGPlayerPrice | undefined;
  
  return tcgPlayerSource?.prices?.market || null;
};

/**
 * Helper function to get eBay/alternative price
 */
const getEbayPrice = (priceData: CardPrices | null): number | null => {
  if (!priceData || !priceData.sources) return null;
  
  // Look for Card Kingdom or other alternative sources
  const alternativeSource = priceData.sources.find((source) => 
    source.source !== 'TCGPlayer'
  );
  
  return extractMarketPrice(alternativeSource);
};

/**
 * Helper function to safely parse HP value
 */
const parseHP = (hp: string | undefined): number | undefined => {
  if (!hp) return undefined;
  const parsed = parseInt(hp, 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Helper function to safely calculate price ranges
 */
const calculatePriceRange = (marketPrice: number | null) => {
  if (!marketPrice || marketPrice <= 0) {
    return {
      low: undefined,
      high: undefined,
    };
  }
  
  return {
    low: Number((marketPrice * 0.8).toFixed(2)),
    high: Number((marketPrice * 1.2).toFixed(2)),
  };
};

export const useCardScanner = ({ onSuccess, onError }: UseCardScannerParams = {}): UseCardScannerReturn => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const scanCard = useCallback(async (imageData: ImageData): Promise<void> => {
    if (!imageData.base64) {
      const errorMessage = 'Image data is missing. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setProgress(0);
    setCurrentStep(0);

    try {
      // Step 1: Extract text from image
      setCurrentStep(0);
      setProgress(0.25);
      console.log('Extracting text from image...');
      const cardInfo = await extractTextFromImage(imageData.base64);
      
      if (!cardInfo || !cardInfo.name) {
        throw new Error(ERROR_MESSAGES.OCR_FAILED);
      }

      console.log('Card info extracted:', cardInfo);

      // Step 2: Validate card with Pokemon API
      setCurrentStep(1);
      setProgress(0.5);
      console.log('Validating card with Pokemon API...');
      const validatedCard = await validateCardWithPokemonAPI(
        cardInfo.name,
        cardInfo.setNumber
      );

      if (!validatedCard) {
        console.warn('Card not found in Pokemon database');
      }

      // Step 3: Verify authenticity
      setCurrentStep(2);
      setProgress(0.75);
      console.log('Verifying card authenticity...');
      const authenticityResult = await verifyCardAuthenticity(cardInfo);

      // Step 4: Get prices if authentic
      setCurrentStep(3);
      setProgress(0.9);
      let priceData: CardPrices | null = null;
      if (authenticityResult.isAuthentic) {
        console.log('Fetching price data...');
        try {
          const enrichedCardInfo: CardInfo = {
            ...cardInfo,
            name: validatedCard?.name || cardInfo.name,
            setName: validatedCard?.set.name,
          };
          priceData = await getCardPrices(enrichedCardInfo);
        } catch (priceError) {
          console.error('Price fetch error:', priceError);
          // Don't fail the entire scan if prices are unavailable
        }
      }

      // Complete
      setProgress(1);

      // Compile results
      const result: ScanResult = {
        cardInfo,
        validatedCard,
        authenticity: authenticityResult,
        prices: priceData,
        scanTime: new Date().toISOString(),
      };

      setScanResult(result);

      // Convert to CardData format for the new UI
      const marketPrice = getBestAvailablePrice(priceData);
      const tcgPlayerPrice = getTCGPlayerPrice(priceData);
      const ebayPrice = getEbayPrice(priceData);
      const priceRange = calculatePriceRange(marketPrice);

      const cardData: CardData = {
        id: generateCardId(result),
        name: validatedCard?.name || cardInfo.name,
        set: validatedCard?.set.name || 'Unknown Set',
        rarity: validatedCard?.rarity || cardInfo.rarity,
        type: cardInfo.type,
        hp: parseHP(cardInfo.hp),
        isAuthentic: authenticityResult.isAuthentic,
        condition: 'Not assessed',
        tcgPlayerPrice: tcgPlayerPrice || undefined,
        ebayPrice: ebayPrice || undefined,
        imageUri: validatedCard?.images?.small || imageData.uri,
        scannedAt: new Date().toISOString(),
        price: {
          market: marketPrice || undefined,
          low: priceRange.low,
          high: priceRange.high,
          average: marketPrice || undefined,
          psa10: priceData?.gradedPrices?.PSA10 || undefined,
        },
        gradedPrices: priceData?.gradedPrices || undefined,
      };

      onSuccess?.(cardData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      console.error('Scan error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsScanning(false);
      setProgress(0);
      setCurrentStep(0);
    }
  }, [onSuccess, onError]);

  const resetScan = useCallback(() => {
    setScanResult(null);
    setError(null);
    setProgress(0);
    setCurrentStep(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scanResult,
    isScanning,
    progress,
    currentStep,
    steps: SCAN_STEPS,
    error,
    scanCard,
    resetScan,
    clearError,
  };
};

const generateCardId = (scanResult: ScanResult): string => {
  const cardName = scanResult.validatedCard?.name || scanResult.cardInfo.name;
  const setName = scanResult.validatedCard?.set.name || 'unknown';
  const setNumber = scanResult.cardInfo.setNumber || 'unknown';
  
  // Create a unique ID based on card name, set, and number
  return `${cardName.replace(/\s+/g, '-').toLowerCase()}-${setName.replace(/\s+/g, '-').toLowerCase()}-${setNumber}`;
};