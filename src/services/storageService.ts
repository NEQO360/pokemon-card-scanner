import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult, CardInfo } from '../types';
import { generateCardId } from '../utils/helpers';

// Storage keys
const STORAGE_KEYS = {
  COLLECTION: '@pokemon_scanner/collection',
  SCAN_HISTORY: '@pokemon_scanner/scan_history',
  USER_PREFERENCES: '@pokemon_scanner/preferences',
  PRICE_CACHE: '@pokemon_scanner/price_cache',
};

export interface StoredCard {
  id: string;
  cardInfo: CardInfo;
  quantity: number;
  condition: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  lastUpdated: string;
  imageUri?: string;
}

export interface UserPreferences {
  defaultCurrency: string;
  enablePriceAlerts: boolean;
  scanQuality: 'low' | 'medium' | 'high';
  theme: 'light' | 'dark' | 'auto';
}

export interface PriceCache {
  cardId: string;
  prices: any;
  timestamp: number;
}

class StorageService {
  // Collection Management
  async saveCard(scanResult: ScanResult, additionalInfo?: Partial<StoredCard>): Promise<void> {
    try {
      const collection = await this.getCollection();
      const cardId = generateCardId(
        scanResult.cardInfo.name,
        scanResult.cardInfo.setNumber
      );

      const storedCard: StoredCard = {
        id: cardId,
        cardInfo: scanResult.cardInfo,
        quantity: 1,
        condition: 'NM',
        lastUpdated: new Date().toISOString(),
        ...additionalInfo,
      };

      // Check if card already exists
      const existingIndex = collection.findIndex(card => card.id === cardId);
      if (existingIndex >= 0) {
        // Update quantity instead of duplicating
        collection[existingIndex].quantity += 1;
        collection[existingIndex].lastUpdated = storedCard.lastUpdated;
      } else {
        collection.push(storedCard);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
    } catch (error) {
      console.error('Error saving card:', error);
      throw new Error('Failed to save card to collection');
    }
  }

  async getCollection(): Promise<StoredCard[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting collection:', error);
      return [];
    }
  }

  async getCard(cardId: string): Promise<StoredCard | null> {
    try {
      const collection = await this.getCollection();
      return collection.find(card => card.id === cardId) || null;
    } catch (error) {
      console.error('Error getting card:', error);
      return null;
    }
  }

  async updateCard(cardId: string, updates: Partial<StoredCard>): Promise<void> {
    try {
      const collection = await this.getCollection();
      const index = collection.findIndex(card => card.id === cardId);
      
      if (index >= 0) {
        collection[index] = {
          ...collection[index],
          ...updates,
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
      }
    } catch (error) {
      console.error('Error updating card:', error);
      throw new Error('Failed to update card');
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const filtered = collection.filter(card => card.id !== cardId);
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to delete card');
    }
  }

  // Scan History
  async saveScanToHistory(scanResult: ScanResult): Promise<void> {
    try {
      const history = await this.getScanHistory();
      history.unshift(scanResult); // Add to beginning
      
      // Keep only last 50 scans
      if (history.length > 50) {
        history.splice(50);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }

  async getScanHistory(): Promise<ScanResult[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting scan history:', error);
      return [];
    }
  }

  // User Preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      defaultCurrency: 'USD',
      enablePriceAlerts: true,
      scanQuality: 'medium',
      theme: 'auto',
    };
  }

  // Price Cache
  async getCachedPrice(cardId: string): Promise<PriceCache | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.PRICE_CACHE}/${cardId}`);
      if (!data) return null;
      
      const cache: PriceCache = JSON.parse(data);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      // Check if cache is still valid (1 hour)
      if (now - cache.timestamp > oneHour) {
        await this.removeCachedPrice(cardId);
        return null;
      }
      
      return cache;
    } catch (error) {
      console.error('Error getting cached price:', error);
      return null;
    }
  }

  async setCachedPrice(cardId: string, prices: any): Promise<void> {
    try {
      const cache: PriceCache = {
        cardId,
        prices,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.PRICE_CACHE}/${cardId}`,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error('Error caching price:', error);
    }
  }

  async removeCachedPrice(cardId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.PRICE_CACHE}/${cardId}`);
    } catch (error) {
      console.error('Error removing cached price:', error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@pokemon_scanner'));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  // Export collection as JSON
  async exportCollection(): Promise<string> {
    try {
      const collection = await this.getCollection();
      return JSON.stringify(collection, null, 2);
    } catch (error) {
      console.error('Error exporting collection:', error);
      throw new Error('Failed to export collection');
    }
  }

  // Import collection from JSON
  async importCollection(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid collection format');
      }
      
      // Validate data structure
      const validCards = imported.filter(card => 
        card.id && card.cardInfo && card.quantity
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(validCards));
    } catch (error) {
      console.error('Error importing collection:', error);
      throw new Error('Failed to import collection');
    }
  }
}

export default new StorageService();