// src/components/ui/Button.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: string; // Add leftIcon prop
  rightIcon?: string; // Add rightIcon prop for consistency
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const buttonStyle: ViewStyle = {
    ...styles.base,
    ...styles[variant],
    ...styles[`size_${size}`],
    ...(fullWidth && styles.fullWidth),
    ...(isDisabled && styles.disabled),
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...styles[`text_${variant}`],
    ...styles[`text_${size}`],
    ...(isDisabled && styles.textDisabled),
  };
 // Get icon color based on variant
  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text.primary;
      case 'secondary':
        return colors.neutral.white;
      case 'outline':
      case 'ghost':
        return colors.primary.yellow;
      default:
        return colors.text.primary;
    }
  };

  // Get icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 18;
      case 'large':
        return 20;
      default:
        return 18;
    }
  };

  const iconColor = getIconColor();
  const iconSize = getIconSize();
  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary.yellow : colors.neutral.white} 
        />
      ) : (
        <>
          {/* Left Icon */}
          {leftIcon && (
            <Ionicons 
              name={leftIcon as any} 
              size={iconSize} 
              color={iconColor} 
              style={styles.leftIcon} 
            />
          )}
          
          {/* Legacy icon prop for backward compatibility */}
          {icon && icon}
          
          <Text style={textStyle}>{title}</Text>
          
          {/* Right Icon */}
          {rightIcon && (
            <Ionicons 
              name={rightIcon as any} 
              size={iconSize} 
              color={iconColor} 
              style={styles.rightIcon} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary.yellow,
  },
  secondary: {
    backgroundColor: colors.secondary.green,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.yellow,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  text_primary: {
    color: colors.text.primary,
  },
  text_secondary: {
    color: colors.neutral.white,
  },
  text_outline: {
    color: colors.primary.yellow,
  },
  text_ghost: {
    color: colors.primary.yellow,
  },
  text_small: {
    fontSize: fontSize.sm,
  },
  text_medium: {
    fontSize: fontSize.base,
  },
  text_large: {
    fontSize: fontSize.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },
    // Icon styles
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
});