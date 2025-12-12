// components/PlatformIcon.tsx
import React from 'react';
import { Platform, Text, TextStyle } from 'react-native';

interface PlatformIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}) => {
  if (Platform.OS === 'web') {
    // Emoji mapping for common icons
    const iconMap: Record<string, string> = {
      // Eye icons
      'eye-outline': '👁️',
      'eye': '👁️',
      'eye-off-outline': '🚫',
      'eye-off': '🚫',
      
      // Lock icons
      'lock-closed-outline': '🔒',
      'lock-outline': '🔒',
      'lock-open-outline': '🔓',
      'lock': '🔒',
      'unlock': '🔓',
      
      // Mail icons
      'mail-outline': '✉️',
      'mail': '✉️',
      
      // Person icons
      'person-outline': '👤',
      'person': '👤',
      
      // Home icons
      'home-outline': '🏠',
      'home': '🏠',
      
      // Menu icons
      'menu-outline': '☰',
      'menu': '☰',
      
      // Arrow icons
      'arrow-back-outline': '←',
      'arrow-forward-outline': '→',
      'chevron-back-outline': '‹',
      'chevron-forward-outline': '›',
      
      // Search icons
      'search-outline': '🔍',
      'search': '🔍',
      
      // Default fallback
      'default': '●',
    };

    const emoji = iconMap[name] || iconMap['default'];
    
    return (
      <Text style={[
        styles.icon, 
        { fontSize: size * 0.8, color }, // Slightly smaller for better fit
        style
      ]}>
        {emoji}
      </Text>
    );
  }
  
  // Native - use vector icons
  try {
    const Ionicons = require('react-native-vector-icons/Ionicons').default;
    return <Ionicons name={name} size={size} color={color} style={style} />;
  } catch (error) {
    // Fallback if vector icons not available
    return (
      <Text style={[styles.fallback, { fontSize: size, color }, style]}>
        [Icon]
      </Text>
    );
  }
};

const styles = {
  icon: {
    lineHeight: 24,
  },
  fallback: {
    fontWeight: 'bold' as const,
  }
};

export default PlatformIcon;