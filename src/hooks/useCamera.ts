import { useState, useEffect, useRef } from 'react';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { IMAGE_SETTINGS, ERROR_MESSAGES } from '../utils/constants';
import { ImageData } from '../types';

interface UseCameraReturn {
  hasPermission: boolean | null;
  cameraRef: React.RefObject<CameraView | null>;
  cameraType: CameraType;
  isProcessing: boolean;
  capturedImage: ImageData | null;
  takePicture: () => Promise<ImageData | null>;
  pickImage: () => Promise<ImageData | null>;
  toggleCameraType: () => void;
  resetCapture: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<ImageData | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          ERROR_MESSAGES.CAMERA_PERMISSION,
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const takePicture = async (): Promise<ImageData | null> => {
    if (!cameraRef.current || isProcessing) return null;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: IMAGE_SETTINGS.QUALITY,
        base64: true,
        exif: false,
      });

      const imageData: ImageData = {
        uri: photo.uri,
        base64: photo.base64 || undefined,
        width: photo.width,
        height: photo.height,
      };

      setCapturedImage(imageData);
      return imageData;
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', ERROR_MESSAGES.IMAGE_CAPTURE);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async (): Promise<ImageData | null> => {
    if (isProcessing) return null;

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: IMAGE_SETTINGS.ASPECT_RATIO,
        quality: IMAGE_SETTINGS.QUALITY,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData: ImageData = {
          uri: asset.uri,
          base64: asset.base64 || undefined,
          width: asset.width,
          height: asset.height,
        };

        setCapturedImage(imageData);
        return imageData;
      }
      return null;
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', ERROR_MESSAGES.IMAGE_CAPTURE);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const resetCapture = () => {
    setCapturedImage(null);
  };

  return {
    hasPermission,
    cameraRef,
    cameraType,
    isProcessing,
    capturedImage,
    takePicture,
    pickImage,
    toggleCameraType,
    resetCapture,
  };
};