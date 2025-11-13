// src/components/ui/Button.tsx
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
import { borderRadius, colors, fontSize, fontWeight, shadows } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
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
          {icon && icon}
          <Text style={textStyle}>{title}</Text>
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
});