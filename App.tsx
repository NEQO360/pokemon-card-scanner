import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import CameraScreen from './src/components/CameraScreen';
import LoadingAnimation from './src/components/loadingAnimation';
import ScanResult from './src/components/ScanResult';
import ToastNotification from './src/components/ToastNotification';
import { ImageData, CardData, ScanResult as ScanResultType } from './src/types';
import { useCardScanner } from './src/hooks/useCardScanner';
import theme from './src/styles/theme';
import DemoControls from './TEMP_DEMO'; // TODO: TEMPORARY

type AppState = 'camera' | 'loading' | 'result';

export default function App() {
  const [appState, setAppState] = useState<AppState>('camera');
  const [scannedCard, setScannedCard] = useState<CardData | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [isDemoMode, setIsDemoMode] = useState(false); // TODO: TEMPORARY

  const {
    scanCard,
    isScanning,
    progress,
    currentStep,
    steps,
    error,
  } = useCardScanner({
    onSuccess: (cardData) => {
      // Enhance the card data with Pokemon-themed properties
      const enhancedCardData: CardData = {
        ...cardData,
        rarity: cardData.rarity || 'Common',
        imageUrl: cardData.imageUri,
        price: {
          market: cardData.tcgPlayerPrice,
          low: cardData.tcgPlayerPrice ? cardData.tcgPlayerPrice * 0.8 : undefined,
          high: cardData.tcgPlayerPrice ? cardData.tcgPlayerPrice * 1.2 : undefined,
          average: cardData.tcgPlayerPrice,
        },
      };

      setScannedCard(enhancedCardData);
      setAppState('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToastMessage('Pokemon card scanned successfully!', 'success');
    },
    onError: (error) => {
      setAppState('camera');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToastMessage('Could not identify this Pokemon card', 'error');
      console.error('Scan error:', error);
    },
  });

  const handleImageCapture = async (imageData: ImageData) => {
    setAppState('loading');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // The hook will handle the scanning and call onSuccess/onError
    await scanCard(imageData);
  };

  const handleScanAgain = () => {
    setAppState('camera');
    setScannedCard(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToastMessage('Ready to scan another Pokemon card!', 'info');
  };

  const handleSaveToCollection = (card: CardData) => {
    // For now, just show a success message
    // In a real app, this would save to AsyncStorage or a database
    showToastMessage(`${card.name} saved to your collection!`, 'success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // TEMPORARY DEMO FUNCTIONS - DELETE AFTER TESTING
  const handleDemoSuccess = (cardData: CardData) => {
    setScannedCard(cardData);
    setAppState('result');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToastMessage('Demo scan successful!', 'success');
  };

  const handleDemoImage = (imageData: ImageData) => {
    setAppState('loading');
    
    // Simulate loading process
    setTimeout(() => {
      // This will be followed by handleDemoSuccess
    }, 2000);
  };

  const renderContent = () => {
    switch (appState) {
      case 'camera':
    return (
          <>
            <CameraScreen onImageCapture={handleImageCapture} />
            {/* TODO: TEMPORARY DEMO CONTROLS */}
            {isDemoMode && (
              <DemoControls 
                onDemoSuccess={handleDemoSuccess} 
                onDemoImage={handleDemoImage}
              />
            )}
          </>
        );
        
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <LoadingAnimation size={80} />
          </View>
        );
        
      case 'result':
        return scannedCard ? (
          <ScanResult
            cardData={scannedCard}
            onScanAgain={handleScanAgain}
            onSaveToCollection={handleSaveToCollection}
          />
        ) : null;
        
      default:
        return <CameraScreen onImageCapture={handleImageCapture} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" translucent />
        
        {renderContent()}
        
        {/* Toast Notification */}
        <ToastNotification
          visible={showToast}
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />
    </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[900],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
  },
});