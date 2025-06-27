import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import theme from '../styles/theme';
import { CardData } from '../types';
import ToastNotification from './ToastNotification';
import AnimatedCard from './AnimatedCard';

interface ScanResultProps {
  cardData: CardData;
  onScanAgain: () => void;
  onSaveToCollection?: (card: CardData) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ShareIcon = ({ size = 20, color = theme.colors.text.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth="2"/>
    <Path d="M16 6l-4-4-4 4" stroke={color} strokeWidth="2"/>
    <Path d="M12 2v13" stroke={color} strokeWidth="2"/>
  </Svg>
);

const PokeballIcon = ({ size = 20, color = theme.colors.text.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <Path d="M3 12h18" stroke={color} strokeWidth="2"/>
    <Circle cx="12" cy="12" r="2" fill={color}/>
  </Svg>
);

const OverviewIcon = ({ size = 20, color, isActive = false }: { size?: number; color: string; isActive?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <Circle cx="12" cy="8" r="1.5" fill={color}/>
    <Path d="M12 11v6" stroke={color} strokeWidth="2"/>
  </Svg>
);

const MarketIcon = ({ size = 20, color, isActive = false }: { size?: number; color: string; isActive?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <Path d="M12 6v12M8 10h8M8 14h8" stroke={color} strokeWidth="2"/>
  </Svg>
);

const CollectionIcon = ({ size = 20, color, isActive = false }: { size?: number; color: string; isActive?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={color} strokeWidth="2"/>
    <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2"/>
  </Svg>
);

const RarityStars = ({ rarity }: { rarity: string }) => {
  const getRarityStars = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 1;
      case 'uncommon': return 2;
      case 'rare': return 3;
      case 'rare holo':
      case 'holographic':
      case 'holo': return 4;
      case 'ultra rare': return 5;
      default: return 1;
    }
  };

  const stars = getRarityStars(rarity);

  return (
    <View style={styles.starsContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.star,
            {
              backgroundColor: index < stars 
                ? theme.colors.warning 
                : theme.colors.gray[200]
            }
          ]}
        />
      ))}
    </View>
  );
};

const StatCard = ({ label, value, accent = false, emoji }: { 
  label: string; 
  value: string | number; 
  accent?: boolean;
  emoji?: string;
}) => (
  <View style={styles.statCard}>
    {emoji && <Text style={styles.statEmoji}>{emoji}</Text>}
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[
      styles.statValue, 
      accent && { color: theme.colors.primary[500] }
    ]}>
      {value}
    </Text>
  </View>
);

export default function ScanResult({ cardData, onScanAgain, onSaveToCollection }: ScanResultProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const tabs = [
    { title: 'Pokédex', icon: OverviewIcon },
    { title: 'Market', icon: MarketIcon },
    { title: 'Trainer', icon: CollectionIcon },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(index);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Just caught a ${cardData.name} with my Pokédex scanner! 📱⚡ Worth $${cardData.price?.market?.toFixed(2) || '12.50'}! #PokemonCards`,
        title: 'Pokemon Card Scanner',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveToCollection = () => {
    if (onSaveToCollection) {
      onSaveToCollection(cardData);
      showToastMessage(`${cardData.name} added to your Pokédex! ⚡`, 'success');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const getTypeBackgroundGradient = (): [string, string, string] => {
    const typeColor = theme.utils.getTypeColor(cardData.type || 'normal');
    return [
      theme.colors.surface.primary,
      theme.utils.hexToRgba(typeColor, 0.02),
      theme.colors.surface.primary,
    ];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Pokédex Entry
        return (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.tabContent}
            contentContainerStyle={styles.contentContainer}
          >

            {/* Stats Grid with Pokemon emojis */}
            <View style={styles.statsGrid}>
              <StatCard label="HP" value={cardData.hp || 'N/A'} />
              <StatCard label="Type" value={cardData.type || 'Normal'}/>
              <StatCard label="Year" value="2023" />
            </View>

            {/* Rarity */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Rarity</Text>
              <View style={styles.rarityRow}>
                <Text style={styles.rarityText}>{cardData.rarity || 'Common'}</Text>
                <RarityStars rarity={cardData.rarity || 'Common'} />
              </View>
            </View>

            {/* Authenticity */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Authenticity Check</Text>
              <View style={styles.authenticityRow}>
                <View style={[
                  styles.authenticityBadge,
                  {
                    backgroundColor: cardData.isAuthentic 
                      ? theme.utils.hexToRgba(theme.colors.success, 0.1)
                      : theme.utils.hexToRgba(theme.colors.error, 0.1)
                  }
                ]}>
                  <Text style={[
                    styles.authenticityText,
                    {
                      color: cardData.isAuthentic 
                        ? theme.colors.success 
                        : theme.colors.error
                    }
                  ]}>
                    {cardData.isAuthentic ? 'Genuine' : 'Suspicious'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 1: // Market Data
        return (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.tabContent}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Current Price */}
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Current Market Value</Text>
              <Text style={styles.priceValue}>
                ${cardData.price?.market?.toFixed(2) || '12.50'}
              </Text>
              <Text style={styles.priceChange}>+5.2% this week</Text>
            </View>

            {/* Price Range */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Price Range</Text>
              <View style={styles.priceRangeGrid}>
                <StatCard 
                  label="Low" 
                  value={`$${cardData.price?.low?.toFixed(2) || '8.99'}`}
                />
                <StatCard 
                  label="High" 
                  value={`$${cardData.price?.high?.toFixed(2) || '18.99'}`}
                />
              </View>
            </View>

            {/* Market Sources */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Trading Post</Text>
              <View style={styles.sourcesList}>
                {[
                  { name: 'TCGPlayer', price: '$12.50' },
                  { name: 'eBay', price: '$11.89' },
                  { name: 'Card Kingdom', price: '$13.25' },
                ].map((source, index) => (
                  <View key={index} style={styles.sourceRow}>
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceName}>{source.name}</Text>
                    </View>
                    <Text style={styles.sourcePrice}>{source.price}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        );

      case 2: // Trainer Collection
        return (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.tabContent}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Collection Details */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Trainer Notes</Text>
              <View style={styles.detailsList}>
                {[
                  { label: 'Condition', value: cardData.condition || 'Near Mint' },
                  { label: 'Artist', value: cardData.artist || 'Ken Sugimori' },
                  { label: 'Set', value: cardData.series || 'Base Set' },
                  { label: 'Card #', value: cardData.number || '001' },
                  { label: 'Captured', value: new Date().toLocaleDateString() },
                ].map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                    </View>
                    <Text style={styles.detailValue}>{detail.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient 
      colors={getTypeBackgroundGradient()}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Clean Header */}
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
          <Text style={styles.headerTitle}>Scan Results</Text>
        </View>

        {/* Compact Hero Section - Card + Info */}
        <View style={styles.compactHeroSection}>
          <View style={styles.cardContainer}>
            <AnimatedCard
              imageUri={cardData.imageUri || cardData.imageUrl || ''}
              type={cardData.type}
              width={120}
              height={168}
              onPress={() => console.log('Card pressed')}
            />
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.pokemonName} numberOfLines={2}>{cardData.name}</Text>
            <View style={styles.setInfo}>
              <Text style={styles.setName}>{cardData.set}</Text>
              <View style={styles.separator} />
              <Text style={styles.setNumber}>#{cardData.number}</Text>
            </View>
            
            {/* Compact Price Display */}
            <View style={styles.compactPriceDisplay}>
              <Text style={styles.currentPrice}>
                ${cardData.price?.market?.toFixed(2) || '12.50'}
              </Text>
              <Text style={styles.priceSubtext}>Current Value</Text>
            </View>
          </View>
        </View>

        {/* Clean Tab Navigation */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === index;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tab,
                  isActive && { 
                    backgroundColor: theme.colors.primary[500],
                    ...theme.shadows.button 
                  }
                ]}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                <IconComponent 
                  size={14} 
                  color={isActive ? theme.colors.text.inverse : theme.colors.text.secondary}
                  isActive={isActive}
                />
                <Text style={[
                  styles.tabTitle,
                  { color: isActive ? theme.colors.text.inverse : theme.colors.text.secondary }
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Expanded Tab Content Container */}
        <View style={styles.expandedTabContentContainer}>
          {renderTabContent()}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + theme.spacing.md }]}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <ShareIcon size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={onScanAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>Scan Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleSaveToCollection}
            activeOpacity={0.7}
          >
            <PokeballIcon size={20} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ToastNotification
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.layout.containerPadding,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
  },
  
  compactHeroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  cardContainer: {
    marginRight: theme.spacing.md,
  },
  cardInfo: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  pokemonName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.sizes.xl * 1.2,
  },
  setInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  setName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  separator: {
    width: 1,
    height: 10,
    backgroundColor: theme.colors.gray[300],
    marginHorizontal: theme.spacing.sm,
  },
  setNumber: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  compactPriceDisplay: {
    alignItems: 'flex-start',
  },
  currentPrice: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs / 2,
  },
  priceSubtext: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
  },
  
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs / 2,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs / 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.xs,
  },
  tabTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
  },
  
  expandedTabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  
  infoCard: {
    ...theme.utils.getCardStyle(),
  },
  cardTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    ...theme.utils.getCardStyle(),
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
  },
  
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  star: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  authenticityRow: {
    alignItems: 'flex-start',
  },
  authenticityBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  authenticityText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semiBold,
  },
  
  priceCard: {
    ...theme.utils.getCardStyle(),
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.sm,
  },
  priceValue: {
    fontSize: theme.typography.sizes['4xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs,
  },
  priceChange: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.medium,
  },
  priceRangeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  
  sourcesList: {
    gap: theme.spacing.md,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceEmoji: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
    marginRight: theme.spacing.xs,
  },
  sourceName: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  sourcePrice: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semiBold,
  },
  
  detailsList: {
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailEmoji: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
    marginRight: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
  },
  detailValue: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semiBold,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryAction: {
    flex: 1,
    ...theme.utils.getButtonStyle('primary'),
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.text.inverse,
  },
  secondaryAction: {
    ...theme.utils.getButtonStyle('secondary'),
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  
  typeBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  typeEmoji: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  typeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  typeContainer: {
    marginBottom: theme.spacing.md,
  },
  
  rarityEmoji: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing.xs,
  },
  statEmoji: {
    fontSize: theme.typography.sizes.base,
    marginBottom: theme.spacing.xs,
  },
});

