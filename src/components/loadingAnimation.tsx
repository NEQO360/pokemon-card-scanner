import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import theme from '../styles/theme';

interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

export default function LoadingAnimation({ 
  size = 60, 
  color = theme.colors.primary[500] 
}: LoadingAnimationProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    rotationAnimation.start();
    pulseAnimation.start();

    return () => {
      rotationAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={{
          transform: [
            { rotate: rotation },
            { scale: scaleAnim },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 50 50">
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary[400]} />
              <Stop offset="100%" stopColor={theme.colors.primary[600]} />
            </LinearGradient>
          </Defs>
          
          <Circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.4"
            strokeDashoffset="15.7"
          />
          
          <Circle
            cx="25"
            cy="25"
            r="3"
            fill={color}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});