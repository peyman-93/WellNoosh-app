import * as React from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/DesignTokens'

export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
  disabled?: boolean
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ style, variant = 'default', size = 'default', children, disabled, ...props }, ref) => {
    const buttonStyles = [
      styles.base,
      styles[variant],
      styles[`size_${size}`],
      disabled && styles.disabled,
      style,
    ]

    const textStyles = [
      styles.text,
      styles[`text_${variant}`],
      styles[`textSize_${size}`],
    ]

    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          ...buttonStyles,
          pressed && styles.pressed,
        ]}
        disabled={disabled}
        {...props}
      >
        <Text style={textStyles}>
          {children}
        </Text>
      </Pressable>
    )
  }
)

Button.displayName = 'Button'

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    minHeight: 44, // iOS minimum touch target
  },
  default: {
    backgroundColor: Colors.primary,
  },
  destructive: {
    backgroundColor: Colors.destructive,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  size_default: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.lg,
  },
  size_icon: {
    height: 44,
    width: 44,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }], // iOS-style press feedback
  },
  text: {
    fontFamily: Typography.fontBody,
    fontWeight: Typography.weights.medium,
  },
  textSize_default: {
    fontSize: Typography.sizes.caption,
  },
  textSize_sm: {
    fontSize: Typography.sizes.small,
  },
  textSize_lg: {
    fontSize: Typography.sizes.base,
  },
  textSize_icon: {
    fontSize: Typography.sizes.caption,
  },
  text_default: {
    color: Colors.primaryForeground,
  },
  text_destructive: {
    color: Colors.primaryForeground,
  },
  text_outline: {
    color: Colors.foreground,
  },
  text_secondary: {
    color: Colors.foreground,
  },
  text_ghost: {
    color: Colors.foreground,
  },
  text_link: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
})

export { Button }