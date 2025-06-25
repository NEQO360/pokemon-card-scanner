import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LoadingAnimation from './src/components/loadingAnimation';
import CameraScreen from './src/components/CameraScreen';
import { extractTextFromImage, verifyCardAuthenticity } from './src/services/ocrService';
import { getCardPrices, validateCardWithPokemonAPI, formatPrice } from './src/services/pricingService';
import { ScanResult, CardInfo, ImageData } from './src/types';

const { width: screenWidth } = Dimensions.get('window');

function MainApp() {
  const insets = useSafeAreaInsets();
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageCapture = async (imageData: ImageData): Promise<void> => {
    if (!imageData.base64) {
      Alert.alert('Error', 'Image data is missing. Please try again.');
      return;
    }

    setIsLoading(true);
    setScanResult(null);
    setError(null);

    try {
      // Step 1: Extract text from image
      const cardInfo = await extractTextFromImage(imageData.base64);
      
      if (!cardInfo || !cardInfo.name) {
        throw new Error('Could not read card information. Please try again with better lighting.');
      }

      // Step 2: Validate card with Pokemon API
      const validatedCard = await validateCardWithPokemonAPI(
        cardInfo.name, 
        cardInfo.setNumber
      );

      // Step 3: Verify authenticity
      const authenticityResult = await verifyCardAuthenticity(cardInfo);

      // Step 4: Get prices if authentic
      let priceData = null;
      if (authenticityResult.isAuthentic && validatedCard) {
        const enrichedCardInfo: CardInfo = {
          ...cardInfo,
          name: validatedCard.name, // Use validated name
          setName: validatedCard.set.name,
        };
        priceData = await getCardPrices(enrichedCardInfo);
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
      setIsScanning(false);

    } catch (error) {
      console.error('Scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process card. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenURL = async (url: string): Promise<void> => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const renderScanResult = (): React.ReactElement | null => {
    if (!scanResult) return null;

    const { cardInfo, validatedCard, authenticity, prices } = scanResult;

    return (
      <ScrollView 
        style={styles.resultContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Image */}
        {validatedCard?.images?.small && (
          <View style={styles.cardImageContainer}>
            <Image 
              source={{ uri: validatedCard.images.small }} 
              style={styles.cardImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={styles.cardImageShadow}
            />
          </View>
        )}

        {/* Card Info */}
        <BlurView intensity={80} tint="light" style={styles.section}>
          <Text style={styles.sectionTitle}>Card Information</Text>
          <Text style={styles.cardName}>{validatedCard?.name || cardInfo.name}</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Set</Text>
              <Text style={styles.detailValue}>{validatedCard?.set.name || 'Unknown'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Number</Text>
              <Text style={styles.detailValue}>{cardInfo.setNumber || 'Unknown'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Rarity</Text>
              <Text style={styles.detailValue}>{validatedCard?.rarity || cardInfo.rarity || 'Unknown'}</Text>
            </View>
            {cardInfo.hp && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>HP</Text>
                <Text style={styles.detailValue}>{cardInfo.hp}</Text>
              </View>
            )}
          </View>
        </BlurView>

        {/* Authenticity Check */}
        <LinearGradient
          colors={authenticity.isAuthentic 
            ? ['#d4f8d4', '#c8f0c8'] 
            : ['#f8d4d4', '#f0c8c8']
          }
          style={[styles.section, styles.authenticitySection]}
        >
          <Text style={styles.sectionTitle}>Authenticity Check</Text>
          <View style={styles.authenticityBadge}>
            <Text style={[
              styles.authenticityIcon,
              { color: authenticity.isAuthentic ? '#2e7d2e' : '#d32f2f' }
            ]}>
              {authenticity.isAuthentic ? '✓' : '✗'}
            </Text>
            <Text style={[
              styles.authenticityResult, 
              { color: authenticity.isAuthentic ? '#2e7d2e' : '#d32f2f' }
            ]}>
              {authenticity.isAuthentic ? 'Appears Authentic' : 'Possibly Fake'}
            </Text>
          </View>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill,
                { 
                  width: `${authenticity.confidence * 100}%`,
                  backgroundColor: authenticity.isAuthentic ? '#4caf50' : '#f44336'
                }
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            Confidence: {(authenticity.confidence * 100).toFixed(0)}%
          </Text>
          {authenticity.issues.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Issues found:</Text>
              {authenticity.issues.map((issue, index) => (
                <Text key={index} style={styles.issue}>• {issue}</Text>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Pricing */}
        {prices && prices.sources.length > 0 && (
          <BlurView intensity={80} tint="light" style={styles.section}>
            <Text style={styles.sectionTitle}>Market Prices</Text>
            {prices.averagePrice !== undefined && prices.averagePrice > 0 && (
              <LinearGradient
                colors={['#4caf50', '#45a049']}
                style={styles.averagePriceContainer}
              >
                <Text style={styles.averagePriceLabel}>Average Market Price</Text>
                <Text style={styles.averagePrice}>{formatPrice(prices.averagePrice)}</Text>
              </LinearGradient>
            )}
            {prices.sources.map((source, index) => (
              <View key={index} style={styles.priceSource}>
                <View style={styles.priceHeader}>
                  <Text style={styles.sourceName}>{source.source}</Text>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleOpenURL(source.url)}
                  >
                    <Text style={styles.viewButtonText}>View →</Text>
                  </TouchableOpacity>
                </View>
                {source.source === 'TCGPlayer' ? (
                  <View style={styles.priceGrid}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Market</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.market)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Low</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.low)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>High</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.high)}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.priceGrid}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>NM</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.nm)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>LP</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.lp)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>MP</Text>
                      <Text style={styles.priceValue}>{formatPrice(source.prices.mp)}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </BlurView>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => {
              setScanResult(null);
              setIsScanning(true);
              setError(null);
            }}
          >
            <LinearGradient
              colors={['#5e72e4', '#3b4cca']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Scan Another Card</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {authenticity.isAuthentic && (
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Coming Soon', 'Save to collection feature coming soon!')}
            >
              <LinearGradient
                colors={['#4caf50', '#45a049']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Save to Collection</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#5e72e4', '#3b4cca']}
        style={styles.header}
      >
        <Text style={styles.title}>Pokémon Card Scanner</Text>
        <Text style={styles.subtitle}>Verify • Price • Collect</Text>
      </LinearGradient>

      {isLoading && (
        <LoadingAnimation 
          text="Analyzing card..."
          subtext="Verifying authenticity and fetching prices"
        />
      )}

      {!isLoading && isScanning && (
        <CameraScreen onImageCapture={handleImageCapture} />
      )}

      {!isLoading && !isScanning && scanResult && renderScanResult()}

      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            activeOpacity={0.8}
            onPress={() => {
              setError(null);
              setIsScanning(true);
            }}
          >
            <LinearGradient
              colors={['#f44336', '#e53935']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorButton: {
    minWidth: 200,
  },
  resultContainer: {
    flex: 1,
  },
  cardImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.84,
    borderRadius: 12,
  },
  cardImageShadow: {
    position: 'absolute',
    bottom: -20,
    width: screenWidth * 0.5,
    height: 40,
    borderRadius: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  cardName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  authenticitySection: {
    borderWidth: 0,
  },
  authenticityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authenticityIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  authenticityResult: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  confidenceBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  issuesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  issue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginTop: 2,
  },
  averagePriceContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  averagePriceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  averagePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceSource: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 76, 202, 0.1)',
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#3b4cca',
    fontSize: 14,
    fontWeight: '600',
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});