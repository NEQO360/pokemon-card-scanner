// TEMPORARY DEMO FILE - DELETE AFTER TESTING
// This file provides mock Pokemon card data for testing the UI

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import theme from './src/styles/theme';
import { CardData, ImageData } from './src/types';

interface DemoControlsProps {
  onDemoSuccess: (cardData: CardData) => void;
  onDemoImage: (imageData: ImageData) => void;
}

// Mock Pokemon card data
const DEMO_CARDS: CardData[] = [
  {
    id: 'demo-pikachu-1',
    name: 'Pikachu',
    set: 'Base Set',
    number: '25',
    rarity: 'Common',
    type: 'Electric',
    hp: 60,
    isAuthentic: true,
    condition: 'Near Mint',
    tcgPlayerPrice: 45.99,
    imageUri: 'https://images.pokemontcg.io/base1/25_hires.png',
    imageUrl: 'https://images.pokemontcg.io/base1/25_hires.png',
    scannedAt: new Date().toISOString(),
    artist: 'Atsuko Nishida',
    series: 'Base',
    releaseDate: '1998',
    price: {
      market: 45.99,
      low: 35.00,
      high: 65.00,
      average: 48.50,
    },
  },
  {
    id: 'demo-charizard-1',
    name: 'Charizard',
    set: 'Base Set',
    number: '4',
    rarity: 'Rare Holo',
    type: 'Fire',
    hp: 120,
    isAuthentic: true,
    condition: 'Lightly Played',
    tcgPlayerPrice: 350.00,
    imageUri: 'https://images.pokemontcg.io/base1/4_hires.png',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    scannedAt: new Date().toISOString(),
    artist: 'Mitsuhiro Arita',
    series: 'Base',
    releaseDate: '1998',
    price: {
      market: 350.00,
      low: 280.00,
      high: 450.00,
      average: 365.00,
    },
  },
  {
    id: 'demo-mewtwo-1',
    name: 'Mewtwo',
    set: 'Base Set',
    number: '10',
    rarity: 'Rare Holo',
    type: 'Psychic',
    hp: 70,
    isAuthentic: true,
    condition: 'Near Mint',
    tcgPlayerPrice: 125.50,
    imageUri: 'https://images.pokemontcg.io/base1/10_hires.png',
    imageUrl: 'https://images.pokemontcg.io/base1/10_hires.png',
    scannedAt: new Date().toISOString(),
    artist: 'Keiji Kinebuchi',
    series: 'Base',
    releaseDate: '1998',
    price: {
      market: 125.50,
      low: 95.00,
      high: 160.00,
      average: 130.25,
    },
  },
  {
    id: 'demo-blastoise-1',
    name: 'Blastoise',
    set: 'Base Set',
    number: '2',
    rarity: 'Rare Holo',
    type: 'Water',
    hp: 100,
    isAuthentic: false, // Demo of questionable authenticity
    condition: 'Moderately Played',
    tcgPlayerPrice: 180.75,
    imageUri: 'https://images.pokemontcg.io/base1/2_hires.png',
    imageUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
    scannedAt: new Date().toISOString(),
    artist: 'Ken Sugimori',
    series: 'Base',
    releaseDate: '1998',
    price: {
      market: 180.75,
      low: 145.00,
      high: 220.00,
      average: 185.50,
    },
  },
];

// Mock image data
const DEMO_IMAGE: ImageData = {
  uri: 'https://images.pokemontcg.io/base1/25_hires.png',
  base64: null,
  width: 734,
  height: 1024,
};

export const DemoControls: React.FC<DemoControlsProps> = ({ onDemoSuccess, onDemoImage }) => {
  const [selectedCard, setSelectedCard] = useState(0);

  const handleDemoScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // First simulate image capture
    onDemoImage(DEMO_IMAGE);
    
    // Then simulate successful scan after a brief delay
    setTimeout(() => {
      onDemoSuccess(DEMO_CARDS[selectedCard]);
    }, 100);
  };

  const nextCard = () => {
    setSelectedCard((prev) => (prev + 1) % DEMO_CARDS.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const currentCard = DEMO_CARDS[selectedCard];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          theme.colors.primary[400],
          theme.colors.primary[500],
          theme.colors.primary[600],
        ]}
        style={styles.gradient}
      >
        <Text style={styles.title}>🎮 DEMO MODE 🎮</Text>
        <Text style={styles.subtitle}>Test the Pokemon UI without physical cards!</Text>
        
        <View style={styles.cardPreview}>
          <Text style={styles.cardName}>{currentCard.name}</Text>
          <Text style={styles.cardDetails}>
            {currentCard.set} • {currentCard.rarity} • ${currentCard.price?.market}
          </Text>
          <Text style={styles.cardType}>{currentCard.type} Type</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={nextCard} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.colors.gray[50], theme.colors.gray[100]]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Switch Card ({selectedCard + 1}/{DEMO_CARDS.length})</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDemoScan} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.buttonGradient}
          >
            <Text style={styles.scanButtonText}>✨ Demo Scan Success ✨</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.warning}>
          ⚠️ This is demo mode. Delete TEMP_DEMO.tsx when done testing!
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 1000,
  },
  gradient: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.gray[50],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray[100],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardPreview: {
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  cardName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.xs,
  },
  cardDetails: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.xs,
  },
  cardType: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.weights.semiBold,
  },
  button: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.gray[700],
  },
  scanButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.gray[50],
  },
  warning: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray[200],
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});

export default DemoControls; 