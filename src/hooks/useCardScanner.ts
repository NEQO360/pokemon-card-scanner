import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ScanResult, CardInfo } from '../types';
import { extractTextFromImage, verifyCardAuthenticity } from '../services/ocrService';
import { getCardPrices, validateCardWithPokemonAPI } from '../services/pricingService';
import { ERROR_MESSAGES } from '../utils/constants';

interface UseCardScannerReturn {
  scanResult: ScanResult | null;
  isLoading: boolean;
  error: string | null;
  scanCard: (base64Image: string) => Promise<ScanResult | null>;
  resetScan: () => void;
  clearError: () => void;
}

export const useCardScanner = (): UseCardScannerReturn => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanCard = useCallback(async (base64Image: string): Promise<ScanResult | null> => {
    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      // Step 1: Extract text from image
      console.log('Extracting text from image...');
      const cardInfo = await extractTextFromImage(base64Image);
      
      if (!cardInfo || !cardInfo.name) {
        throw new Error(ERROR_MESSAGES.OCR_FAILED);
      }

      console.log('Card info extracted:', cardInfo);

      // Step 2: Validate card with Pokemon API
      console.log('Validating card with Pokemon API...');
      const validatedCard = await validateCardWithPokemonAPI(
        cardInfo.name,
        cardInfo.setNumber
      );

      if (!validatedCard) {
        console.warn('Card not found in Pokemon database');
      }

      // Step 3: Verify authenticity
      console.log('Verifying card authenticity...');
      const authenticityResult = await verifyCardAuthenticity(cardInfo);

      // Step 4: Get prices if authentic
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

      // Compile results
      const result: ScanResult = {
        cardInfo,
        validatedCard,
        authenticity: authenticityResult,
        prices: priceData,
        scanTime: new Date().toISOString(),
      };

      setScanResult(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      console.error('Scan error:', err);
      setError(errorMessage);
      
      // Don't show network errors as alerts, just set the error state
      if (!errorMessage.includes('Network')) {
        Alert.alert('Scan Error', errorMessage);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetScan = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scanResult,
    isLoading,
    error,
    scanCard,
    resetScan,
    clearError,
  };
};