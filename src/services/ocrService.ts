import axios from 'axios';
import { 
  CardInfo, 
  AuthenticityResult, 
  AuthenticityChecks, 
  VisionAPIResponse 
} from '../types';
import { GOOGLE_VISION_API_KEY } from '@env';
import { mockExtractTextFromImage, generateMockAuthenticityIssues } from '../utils/mockOCRService';

// Use environment variable or prompt user to add key
const API_KEY = GOOGLE_VISION_API_KEY || '';

console.log('🔑 Google Vision API Key status:', API_KEY ? `Set (${API_KEY.substring(0, 10)}...)` : 'Not set');

const GOOGLE_CLOUD_VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

export const extractTextFromImage = async (base64Image: string): Promise<CardInfo | null> => {
  // If no API key, use mock data
  if (!API_KEY) {
    console.warn('⚠️  Google Vision API key not set! Using mock data for testing.');
    console.log('📌 To enable real OCR, add GOOGLE_VISION_API_KEY to your .env file');
    return await mockExtractTextFromImage(base64Image);
  }

  try {
    const body = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await axios.post<VisionAPIResponse>(
      GOOGLE_CLOUD_VISION_API_URL, 
      body
    );
    
    if (response.data.responses[0].textAnnotations) {
      const extractedText = response.data.responses[0].textAnnotations[0].description;
      return parseCardInfo(extractedText);
    }
    
    return null;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};

const parseCardInfo = (text: string): CardInfo => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const cardInfo: CardInfo = {
    name: '',
    setNumber: '',
    hp: '',
    type: '',
    rarity: '',
    fullText: text
  };

  // Look for card name (usually at the top)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for HP pattern
    const hpMatch = line.match(/(\w+.*?)\s+(?:HP\s*)?(\d+)\s*HP/i) || 
                    line.match(/(\w+.*?)\s+HP\s*(\d+)/i);
    
    if (hpMatch) {
      cardInfo.name = hpMatch[1].trim();
      cardInfo.hp = hpMatch[2];
      break;
    }
    
    // If first line doesn't have HP, it might still be the name
    if (i === 0 && !cardInfo.name) {
      cardInfo.name = line;
    }
  }

  // Look for set number (usually at bottom, format: 123/456)
  const setNumberMatch = text.match(/(\d+\/\d+)/);
  if (setNumberMatch) {
    cardInfo.setNumber = setNumberMatch[1];
  }

  // Look for type
  const typeMatch = text.match(/\b(Fire|Water|Grass|Electric|Psychic|Fighting|Dark|Steel|Fairy|Dragon|Normal|Colorless)\b/i);
  if (typeMatch) {
    cardInfo.type = typeMatch[1];
  }

  // Look for rarity symbols
  if (text.includes('★') || text.match(/\bRare\b/i)) {
    cardInfo.rarity = 'Rare';
  } else if (text.includes('◆')) {
    cardInfo.rarity = 'Uncommon';
  } else if (text.includes('●')) {
    cardInfo.rarity = 'Common';
  }

  return cardInfo;
};

export const verifyCardAuthenticity = async (cardInfo: CardInfo): Promise<AuthenticityResult> => {
  // Initial authenticity checks
  const checks: AuthenticityChecks = {
    hasName: !!cardInfo.name,
    hasSetNumber: !!cardInfo.setNumber,
    hasHP: !!cardInfo.hp,
    fontConsistency: true, // Would need image analysis
    printQuality: true, // Would need image analysis
    holoPattern: true, // Would need image analysis for holo cards
  };

  // Basic validation
  if (!checks.hasName || !checks.hasSetNumber) {
    return {
      isAuthentic: false,
      confidence: 0.3,
      issues: ['Missing essential card information'],
      checks
    };
  }

  // Check against Pokemon TCG database
  const isValidCard = await checkPokemonDatabase(cardInfo);
  
  if (!isValidCard) {
    return {
      isAuthentic: false,
      confidence: 0.4,
      issues: ['Card not found in official database'],
      checks
    };
  }

  // Calculate confidence score
  const passedChecks = Object.values(checks).filter(check => check).length;
  const totalChecks = Object.keys(checks).length;
  const confidence = passedChecks / totalChecks;

  return {
    isAuthentic: confidence > 0.7,
    confidence,
    issues: [],
    checks
  };
};

// Mock function - replace with actual Pokemon TCG API call
const checkPokemonDatabase = async (cardInfo: CardInfo): Promise<boolean> => {
  // This would call the Pokemon TCG API
  // For now, return true for testing
  return true;
};