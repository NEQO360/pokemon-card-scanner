import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from '../types';

const COLLECTION_KEY = 'pokemon_card_collection';

export interface SavedCard {
  id: string;
  scanResult: ScanResult;
  savedAt: string;
  tags?: string[];
  notes?: string;
}

export const saveCardToCollection = async (
  scanResult: ScanResult,
  tags?: string[],
  notes?: string
): Promise<SavedCard> => {
  try {
    const collection = await getCollection();
    const savedCard: SavedCard = {
      id: generateCardId(scanResult),
      scanResult,
      savedAt: new Date().toISOString(),
      tags,
      notes,
    };
    
    // Check if card already exists
    const existingIndex = collection.findIndex(card => card.id === savedCard.id);
    if (existingIndex >= 0) {
      // Update existing card
      collection[existingIndex] = savedCard;
    } else {
      // Add new card
      collection.unshift(savedCard); // Add to beginning
    }
    
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
    return savedCard;
  } catch (error) {
    console.error('Error saving card to collection:', error);
    throw new Error('Failed to save card to collection');
  }
};

export const getCollection = async (): Promise<SavedCard[]> => {
  try {
    const collectionData = await AsyncStorage.getItem(COLLECTION_KEY);
    return collectionData ? JSON.parse(collectionData) : [];
  } catch (error) {
    console.error('Error getting collection:', error);
    return [];
  }
};

export const removeCardFromCollection = async (cardId: string): Promise<void> => {
  try {
    const collection = await getCollection();
    const updatedCollection = collection.filter(card => card.id !== cardId);
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(updatedCollection));
  } catch (error) {
    console.error('Error removing card from collection:', error);
    throw new Error('Failed to remove card from collection');
  }
};

export const getCollectionStats = async (): Promise<{
  totalCards: number;
  authenticCards: number;
  totalValue: number;
  sets: Set<string>;
}> => {
  try {
    const collection = await getCollection();
    const stats = {
      totalCards: collection.length,
      authenticCards: collection.filter(card => card.scanResult.authenticity.isAuthentic).length,
      totalValue: 0,
      sets: new Set<string>(),
    };
    
    collection.forEach(card => {
      if (card.scanResult.prices?.averagePrice) {
        stats.totalValue += card.scanResult.prices.averagePrice;
      }
      if (card.scanResult.validatedCard?.set.name) {
        stats.sets.add(card.scanResult.validatedCard.set.name);
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting collection stats:', error);
    throw new Error('Failed to get collection statistics');
  }
};

export const searchCollection = async (query: string): Promise<SavedCard[]> => {
  try {
    const collection = await getCollection();
    const lowerQuery = query.toLowerCase();
    
    return collection.filter(card => {
      const cardName = (card.scanResult.validatedCard?.name || card.scanResult.cardInfo.name).toLowerCase();
      const setName = (card.scanResult.validatedCard?.set.name || '').toLowerCase();
      const tags = (card.tags || []).join(' ').toLowerCase();
      const notes = (card.notes || '').toLowerCase();
      
      return cardName.includes(lowerQuery) ||
             setName.includes(lowerQuery) ||
             tags.includes(lowerQuery) ||
             notes.includes(lowerQuery);
    });
  } catch (error) {
    console.error('Error searching collection:', error);
    throw new Error('Failed to search collection');
  }
};

export const exportCollection = async (): Promise<string> => {
  try {
    const collection = await getCollection();
    return JSON.stringify(collection, null, 2);
  } catch (error) {
    console.error('Error exporting collection:', error);
    throw new Error('Failed to export collection');
  }
};

export const importCollection = async (data: string): Promise<void> => {
  try {
    const importedCollection: SavedCard[] = JSON.parse(data);
    const existingCollection = await getCollection();
    
    // Merge collections, avoiding duplicates
    const mergedCollection = [...existingCollection];
    
    importedCollection.forEach(importedCard => {
      if (!mergedCollection.find(card => card.id === importedCard.id)) {
        mergedCollection.push(importedCard);
      }
    });
    
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(mergedCollection));
  } catch (error) {
    console.error('Error importing collection:', error);
    throw new Error('Failed to import collection');
  }
};

const generateCardId = (scanResult: ScanResult): string => {
  const cardName = scanResult.validatedCard?.name || scanResult.cardInfo.name;
  const setName = scanResult.validatedCard?.set.name || 'unknown';
  const setNumber = scanResult.cardInfo.setNumber || 'unknown';
  
  // Create a unique ID based on card name, set, and number
  return `${cardName.replace(/\s+/g, '-').toLowerCase()}-${setName.replace(/\s+/g, '-').toLowerCase()}-${setNumber}`;
}; 