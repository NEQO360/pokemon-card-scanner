import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import theme from '../styles/theme';
import { ImageData } from '../types';

interface CameraScreenProps {
  onImageCapture: (image: ImageData) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SCAN_AREA_SIZE = screenWidth * 0.75;

const GalleryIcon = ({ size = 24, color = theme.colors.text.inverse }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/>
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color}/>
    <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2"/>
  </Svg>
);

const FlipIcon = ({ size = 24, color = theme.colors.text.inverse }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2"/>
  </Svg>
);

const FlashIcon = ({ size = 24, color = theme.colors.text.inverse, active = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon 
      points="13,2 3,14 12,14 11,22 21,10 12,10" 
      fill={active ? theme.colors.warning : 'none'}
      stroke={color} 
      strokeWidth="2"
    />
  </Svg>
);

const GridIcon = ({ size = 24, color = theme.colors.text.inverse }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 2v20M16 2v20M2 8h20M2 16h20" stroke={color} strokeWidth="1.5"/>
  </Svg>
);
  
const ScanFrame = ({ size }: { size: number }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const cornerSize = 30;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <View style={{ width: size, height: size }}>
        <View style={[styles.scanCorner, styles.topLeft, { width: cornerSize, height: cornerSize }]} />
        <View style={[styles.scanCorner, styles.topRight, { width: cornerSize, height: cornerSize }]} />
        <View style={[styles.scanCorner, styles.bottomLeft, { width: cornerSize, height: cornerSize }]} />
        <View style={[styles.scanCorner, styles.bottomRight, { width: cornerSize, height: cornerSize }]} />
      </View>
    </Animated.View>
  );
};

export default function CameraScreen({ onImageCapture }: CameraScreenProps) {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  
  const scanLineProgress = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestPermissions();
    startAnimations();
    
    return () => {
      scanLineProgress.stopAnimation();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const startAnimations = () => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineProgress, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineProgress, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ])
    );

    scanAnimation.start();
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animateCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(captureScale, {
        toValue: 0.95,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }),
      Animated.spring(captureScale, {
        toValue: 1,
        ...theme.animation.spring,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      animateCapture();
      
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.95,
          base64: true,
          exif: false,
          skipProcessing: false,
        });
        
        if (photo) {
          const imageData: ImageData = {
            uri: photo.uri,
            base64: photo.base64 || undefined,
            width: photo.width,
            height: photo.height,
          };
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onImageCapture(imageData);
        }
      } catch (error) {
        console.error('Camera error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.95,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageData: ImageData = {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 || undefined,
        width: result.assets[0].width,
        height: result.assets[0].height,
      };
      
      onImageCapture(imageData);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlashMode(!flashMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface.primary} />
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Preparing camera...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface.primary} />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" 
                    stroke={theme.colors.primary[500]} strokeWidth="2"/>
              <Circle cx="12" cy="13" r="4" stroke={theme.colors.primary[500]} strokeWidth="2"/>
            </Svg>
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            Please allow camera access to scan Pokemon cards
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermissions}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        flash={flashMode ? 'on' : 'off'}
      />
      
      <View style={styles.scanOverlay} pointerEvents="none">
        {showGrid && (
          <View style={styles.gridOverlay}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: `${(i + 1) * 25}%` }]} />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${(i + 1) * 25}%` }]} />
            ))}
          </View>
        )}
        
        <View style={styles.scanAreaContainer}>
          <ScanFrame size={SCAN_AREA_SIZE} />
          
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLineProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-SCAN_AREA_SIZE/2, SCAN_AREA_SIZE/2],
                  }),
                }],
                opacity: scanLineProgress.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0, 0.8, 0.8, 0],
                }),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <BlurView intensity={20} tint="light" style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Position Card in Frame</Text>
          <Text style={styles.instructionsSubtitle}>
            Align the Pokemon card within the scanning area
          </Text>
        </BlurView>
      </View>

      <View 
        style={[
          styles.topControls,
          { paddingTop: insets.top + theme.spacing.md }
        ]}
      >
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleGrid}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} tint="dark" style={styles.controlButtonBlur}>
            <GridIcon size={20} color={theme.colors.text.inverse} />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.topControlsCenter}>
          <BlurView intensity={20} tint="dark" style={styles.modeIndicator}>
            <Text style={styles.modeText}>SCAN MODE</Text>
          </BlurView>
        </View>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleFlash}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} tint="dark" style={styles.controlButtonBlur}>
            <FlashIcon size={20} color={theme.colors.text.inverse} active={flashMode} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <View 
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + theme.spacing.xl }
        ]}
      >
        <TouchableOpacity
          style={styles.sideControl}
          onPress={pickFromGallery}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} tint="dark" style={styles.sideControlBlur}>
            <GalleryIcon size={24} color={theme.colors.text.inverse} />
          </BlurView>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: captureScale }] }}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.9}
            disabled={isCapturing}
          >
            <View style={[
              styles.captureButtonOuter,
              { backgroundColor: isCapturing ? theme.colors.warning : theme.colors.primary[500] }
            ]}>
              <View style={styles.captureButtonInner}>
                <View style={[
                  styles.captureButtonCore,
                  { backgroundColor: isCapturing ? theme.colors.warning : theme.colors.text.inverse }
                ]} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.sideControl}
          onPress={toggleCamera}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} tint="dark" style={styles.sideControlBlur}>
            <FlipIcon size={24} color={theme.colors.text.inverse} />
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[900],
  },
  camera: {
    flex: 1,
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.primary[200],
    borderTopColor: theme.colors.primary[500],
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
    marginTop: theme.spacing.lg,
  },
  
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    maxWidth: 320,
  },
  permissionIcon: {
    marginBottom: theme.spacing.lg,
  },
  permissionTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  permissionDescription: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.base,
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    ...theme.utils.getButtonStyle('primary'),
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semiBold,
  },
  
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: theme.colors.text.inverse,
    opacity: 0.3,
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  scanAreaContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCorner: {
    position: 'absolute',
    borderColor: theme.colors.primary[500],
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: SCAN_AREA_SIZE * 0.8,
    height: 2,
    backgroundColor: theme.colors.primary[500],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    borderRadius: 1,
  },
  
  instructionsContainer: {
    position: 'absolute',
    top: '15%',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  instructionsCard: {
    ...theme.utils.getCardStyle(),
    alignItems: 'center',
  },
  instructionsTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semiBold,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  instructionsSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  topControlsCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modeIndicator: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  modeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  controlButton: {
    width: 44,
    height: 44,
  },
  controlButtonBlur: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
  },
  sideControl: {
    width: 50,
    height: 50,
  },
  sideControlBlur: {
    flex: 1,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  captureButton: {
    width: 80,
    height: 80,
  },
  captureButtonOuter: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.text.inverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});