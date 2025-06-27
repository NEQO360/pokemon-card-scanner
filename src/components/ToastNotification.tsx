import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import theme from '../styles/theme';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide: () => void;
}

const SuccessIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={theme.colors.success} stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Path d="m9 12 2 2 4-4" stroke={theme.colors.text.inverse} strokeWidth="2"/>
  </Svg>
);

const ErrorIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={theme.colors.error} stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Path d="m15 9-6 6" stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Path d="m9 9 6 6" stroke={theme.colors.text.inverse} strokeWidth="2"/>
  </Svg>
);

const WarningIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={theme.colors.warning} stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Path d="M12 8v4" stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Circle cx="12" cy="16" r="1" fill={theme.colors.text.inverse}/>
  </Svg>
);

const InfoIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={theme.colors.info} stroke={theme.colors.text.inverse} strokeWidth="2"/>
    <Circle cx="12" cy="8" r="1" fill={theme.colors.text.inverse}/>
    <Path d="M12 12v4" stroke={theme.colors.text.inverse} strokeWidth="2"/>
  </Svg>
);

export default function ToastNotification({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
}: ToastNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.animation.duration.normal,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: theme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: theme.animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideToast();
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.info;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchable}
      >
        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
          <View style={[
            styles.toast,
            { borderLeftColor: getTypeColor() }
          ]}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1000,
  },
  touchable: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface.card,
    borderLeftWidth: 4,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
  },
}); 