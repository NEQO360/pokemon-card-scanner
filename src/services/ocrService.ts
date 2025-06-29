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

  // Validate base64 image format
  if (!base64Image || base64Image.length === 0) {
    console.error('❌ Invalid base64 image data');
    throw new Error('Invalid image data provided');
  }

  // Remove data URL prefix if present (data:image/jpeg;base64,)
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  console.log('📡 Making request to Google Vision API...');
  console.log('🔍 Base64 image length:', cleanBase64.length);

  try {
    const body = {
      requests: [
        {
          image: {
            content: cleanBase64,
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

    console.log('📤 Request body prepared, sending to Vision API...');

    const response = await axios.post<VisionAPIResponse>(
      GOOGLE_CLOUD_VISION_API_URL, 
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ Vision API response received');
    console.log('📊 Response status:', response.status);

    if (response.data.responses && response.data.responses.length > 0) {
      const visionResponse = response.data.responses[0];
      
      // Check for errors in the response
      if ('error' in visionResponse) {
        console.error('❌ Vision API returned error:', visionResponse.error);
        throw new Error(`Vision API error: ${JSON.stringify(visionResponse.error)}`);
      }

      if (visionResponse.textAnnotations && visionResponse.textAnnotations.length > 0) {
        const extractedText = visionResponse.textAnnotations[0].description;
        console.log('📝 Extracted text:', extractedText.substring(0, 200) + '...');
        return parseCardInfo(extractedText);
      } else {
        console.warn('⚠️ No text found in image');
        // Fall back to mock data when no text is detected
        return await mockExtractTextFromImage(base64Image);
      }
    }
    
    console.warn('⚠️ Empty response from Vision API, using mock data');
    return await mockExtractTextFromImage(base64Image);

  } catch (error) {
    console.error('❌ OCR Error details:');
    
    if (axios.isAxiosError(error)) {
      console.error('📍 Request URL:', error.config?.url);
      console.error('📱 Response status:', error.response?.status);
      console.error('📄 Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('🔗 Request headers:', JSON.stringify(error.config?.headers, null, 2));
      
      // Handle specific Google Vision API errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData?.error?.message) {
          console.error('🚫 Google Vision API Error:', errorData.error.message);
          
          // Common error scenarios
          if (errorData.error.message.includes('API key')) {
            console.error('🔑 API Key issue detected');
            console.error('💡 Check that your Google Vision API key is valid and has the Vision API enabled');
          }
          
          if (errorData.error.message.includes('quota')) {
            console.error('💳 Quota exceeded');
            console.error('💡 Check your Google Cloud billing and API quotas');
          }
          
          if (errorData.error.message.includes('permission')) {
            console.error('🚫 Permission denied');
            console.error('💡 Ensure the Vision API is enabled for your Google Cloud project');
          }
        }
      }
      
      // For 400 errors, provide more helpful context
      if (error.response?.status === 400) {
        console.error('💡 Common causes of 400 errors:');
        console.error('   1. Invalid API key');
        console.error('   2. Vision API not enabled in Google Cloud Console');
        console.error('   3. Invalid base64 image format');
        console.error('   4. Image too large (>20MB)');
        console.error('   5. Billing not enabled on Google Cloud project');
      }
    } else {
      console.error('❌ Non-Axios error:', error);
    }
    
    console.log('🔄 Falling back to mock data due to API error');
    return await mockExtractTextFromImage(base64Image);
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

  console.log('📋 Parsed card info:', {
    name: cardInfo.name,
    hp: cardInfo.hp,
    type: cardInfo.type,
    setNumber: cardInfo.setNumber,
    rarity: cardInfo.rarity
  });

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