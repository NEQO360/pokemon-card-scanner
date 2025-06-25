import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageData } from '../types';

interface CameraScreenProps {
  onImageCapture: (image: ImageData) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen({ onImageCapture }: CameraScreenProps) {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<ImageData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const animateCapture = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const takePicture = async (): Promise<void> => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      animateCapture();
      
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });
        
        if (photo) {
          const imageData: ImageData = {
            uri: photo.uri,
            base64: photo.base64 || undefined,
            width: photo.width,
            height: photo.height,
          };
          
          setCapturedImage(imageData);
          onImageCapture(imageData);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageData: ImageData = {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 || undefined,
        width: result.assets[0].width,
        height: result.assets[0].height,
      };
      
      setCapturedImage(imageData);
      onImageCapture(imageData);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionText}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtext}>
          Please enable camera access to scan Pokemon cards
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={styles.container}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          
          {/* Scanning Frame Overlay - Now positioned absolutely */}
          <View style={StyleSheet.absoluteFillObject}>
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTL]} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />
              </View>
              <Text style={styles.scanHint}>Position card within frame</Text>
            </View>

            {/* Top Controls */}
            <BlurView intensity={80} tint="dark" style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.topButton}
                onPress={toggleCameraFacing}
                activeOpacity={0.7}
              >
                <Text style={styles.topButtonText}>🔄</Text>
              </TouchableOpacity>
            </BlurView>

            {/* Bottom Controls */}
            <BlurView 
              intensity={80} 
              tint="dark" 
              style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
            >
              <TouchableOpacity
                style={styles.sideButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Text style={styles.sideButtonIcon}>🖼️</Text>
                <Text style={styles.sideButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButtonContainer}
                onPress={takePicture}
                activeOpacity={0.8}
                disabled={isCapturing}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <LinearGradient
                    colors={['#fff', '#f0f0f0']}
                    style={styles.captureButton}
                  >
                    <View style={styles.captureButtonInner} />
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              <View style={styles.sideButton}>
                <Text style={styles.sideButtonIcon}>✨</Text>
                <Text style={styles.sideButtonText}>Auto</Text>
              </View>
            </BlurView>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={styles.previewBackground}
          >
            <Text style={styles.previewTitle}>Review Capture</Text>
            <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => setCapturedImage(null)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#666', '#555']}
                  style={styles.previewButtonGradient}
                >
                  <Text style={styles.previewButtonText}>Retake</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.previewButton, styles.confirmButton]}
                onPress={() => onImageCapture(capturedImage)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4caf50', '#45a049']}
                  style={styles.previewButtonGradient}
                >
                  <Text style={styles.previewButtonText}>Use Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8 * 1.4,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonText: {
    fontSize: 24,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
  },
  sideButton: {
    alignItems: 'center',
    width: 80,
  },
  sideButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  sideButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
  },
  previewBackground: {
    flex: 1,
    padding: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  preview: {
    flex: 1,
    borderRadius: 12,
    marginVertical: 20,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 40,
  },
  previewButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  previewButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});