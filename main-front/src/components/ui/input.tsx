import * as React from 'react'
import { TextInput, StyleSheet, type TextInputProps } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/DesignTokens'

export interface InputProps extends TextInputProps {
  error?: boolean
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ style, error, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          error && styles.error,
          style,
        ]}
        placeholderTextColor={Colors.mutedForeground}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  input: {
    height: 44, // iOS minimum touch target
    width: '100%',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    fontFamily: Typography.fontBody,
  },
  error: {
    borderColor: Colors.destructive,
  },
})

export { Input }