// src/utils/alert.ts
import { Alert, Platform } from 'react-native';

// For simple alerts
export const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// For confirmation dialogs with buttons
export const showConfirmation = (
  title: string, 
  message: string, 
  buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>
) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      const confirmButton = buttons.find(btn => btn.style !== 'cancel');
      confirmButton?.onPress?.();
    } else {
      const cancelButton = buttons.find(btn => btn.style === 'cancel');
      cancelButton?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// For success messages
export const showSuccess = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`✅ ${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// For error messages
export const showError = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`❌ ${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};