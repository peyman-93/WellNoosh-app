// Design tokens for WellNoosh app
export const Colors = {
  primary: '#6B8E23',      // Organic leaf green
  secondary: '#E6A245',    // Golden wheat
  background: '#FAF7F0',   // Organic warm background
  surface: '#FFFFFF',      // Pure white
  text: '#1A1A1A',         // Deep charcoal
  textSecondary: '#4A4A4A', // Medium gray
  border: '#E0E0E0',       // Light gray border
  success: '#6B8E23',      // Same as primary
  warning: '#E6A245',      // Same as secondary
  destructive: '#DC6B3F',  // Warm terracotta
  muted: '#F5F5F5',        // Very light gray
  // Additional colors for card component
  card: '#FFFFFF',
  foreground: '#1A1A1A',
  mutedForeground: '#4A4A4A',
  inputBackground: '#FFFFFF',
  // Brand colors structure
  brand: {
    // Gray palette
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#E0E0E0',
    gray300: '#C4C4C4',
    gray400: '#A0A0A0',
    gray500: '#7A7A7A',
    gray600: '#4A4A4A',
    gray700: '#2D2D2D',
    gray800: '#1A1A1A',
    gray900: '#0F0F0F',
    
    // Blue palette
    blue50: '#EFF6FF',
    blue200: '#BFDBFE',
    blue300: '#93C5FD',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    
    // Emerald palette
    emerald50: '#ECFDF5',
    
    // Red palette
    red100: '#FEE2E2',
    
    // Violet palette
    violet50: '#F5F3FF',
  },
}

export const Typography = {
  fontFamily: 'Inter',
  fontBody: 'Inter',
  fontBrand: 'Inter',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    // Additional sizes for card component
    caption: 12,
    subsection: 16,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  // Additional spacing for card component
  cardPadding: 16,
}

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
}

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  // Additional shadow for card component
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
}