import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '../styles/theme';

interface AnimatedCardProps {
  imageUri: string;
  type?: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  interactive?: boolean;
}

export default function AnimatedCard({
  imageUri,
  type = 'normal',
  width = theme.layout.cardWidth,
  height = theme.layout.cardHeight,
  onPress,
  interactive = true,
}: AnimatedCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!interactive) return;
    
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 2,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!interactive) return;
    
    setIsPressed(false);
    
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!interactive || !onPress) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getTypeAccentColor = () => {
    return theme.utils.getTypeColor(type);
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={!interactive}
      >
        <Animated.View
          style={{
            width,
            height,
            opacity,
            transform: [
              { scale },
              { translateY },
            ],
          }}
        >
          {/* Main Card Container */}
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.colors.surface.card,
              borderRadius: theme.radius.xl,
              borderWidth: 3,
              borderColor: theme.colors.surface.card,
              ...theme.shadows.lg,
              overflow: 'hidden',
            }}
          >
            {/* Card Image */}
            <Image
              source={{ uri: imageUri }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: theme.radius.lg,
              }}
              resizeMode="cover"
            />
            
            {/* Subtle Type Accent */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: getTypeAccentColor(),
                opacity: 0.6,
              }}
            />
          </View>

          {/* Pressed State Overlay */}
          {isPressed && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: theme.radius.xl,
              }}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
} 