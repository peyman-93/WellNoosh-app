import * as React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '@/constants/DesignTokens'

const Card = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ style, ...props }, ref) => (
  <View
    ref={ref}
    style={[styles.card, style]}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ style, ...props }, ref) => (
  <View
    ref={ref}
    style={[styles.header, style]}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ style, ...props }, ref) => (
  <Text
    ref={ref}
    style={[styles.title, style]}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ style, ...props }, ref) => (
  <Text
    ref={ref}
    style={[styles.description, style]}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ style, ...props }, ref) => (
  <View ref={ref} style={[styles.content, style]} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ style, ...props }, ref) => (
  <View
    ref={ref}
    style={[styles.footer, style]}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  header: {
    paddingHorizontal: Spacing.cardPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    lineHeight: Typography.sizes.subsection * Typography.lineHeights.tight,
    fontFamily: Typography.fontBrand,
  },
  description: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: Typography.sizes.caption * Typography.lineHeights.normal,
    fontFamily: Typography.fontBody,
  },
  content: {
    paddingHorizontal: Spacing.cardPadding,
    paddingBottom: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.cardPadding,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
})

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }