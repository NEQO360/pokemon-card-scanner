import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ScanResult, CardInfo, CardData, ImageData } from '../types';
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
      let priceData = null;
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
      const cardData: CardData = {
        id: generateCardId(result),
        name: validatedCard?.name || cardInfo.name,
        set: validatedCard?.set.name || 'Unknown Set',
        rarity: validatedCard?.rarity || cardInfo.rarity,
        type: cardInfo.type,
        hp: cardInfo.hp ? parseInt(cardInfo.hp) : undefined,
        isAuthentic: authenticityResult.isAuthentic,
        condition: 'Not assessed',
        tcgPlayerPrice: priceData?.averagePrice,
        ebayPrice: priceData?.sources.find(s => s.source === 'TCGPlayer')?.prices?.market,
        imageUri: validatedCard?.images?.small || imageData.uri,
        scannedAt: new Date().toISOString(),
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