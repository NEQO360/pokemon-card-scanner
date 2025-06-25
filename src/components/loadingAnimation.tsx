import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingAnimationProps {
  text?: string;
  subtext?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function LoadingAnimation({ 
  text = 'Analyzing card...', 
  subtext = 'This may take a moment' 
}: LoadingAnimationProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Dots animation
    const dotsAnimation = Animated.loop(
      Animated.timing(dotsAnim, {
        toValue: 3,
        duration: 1500,
        useNativeDriver: false,
      })
    );

    rotateAnimation.start();
    pulseAnimation.start();
    dotsAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
      dotsAnimation.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      dots.push(
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: dotsAnim.interpolate({
                inputRange: [i, i + 0.5, i + 1],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ rotate }, { scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#5e72e4', '#3b4cca', '#5e72e4']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <View style={styles.innerCircle}>
          <Text style={styles.pokeball}>⚪</Text>
        </View>
      </View>

      <Text style={styles.loadingText}>{text}</Text>
      <View style={styles.dotsContainer}>
        <Text style={styles.loadingSubtext}>{subtext}</Text>
        <View style={styles.dots}>{renderDots()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  animationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pokeball: {
    fontSize: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
  },
  dots: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
});