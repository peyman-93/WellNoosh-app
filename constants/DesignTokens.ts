/**
 * WellNoosh V3 Design System
 * Design tokens for consistent styling across the app
 */

export const Colors = {
  // Primary Colors (V3 Figma)
  background: '#ffffff',
  foreground: '#1F2937',
  primary: '#1F2937',
  primaryForeground: '#ffffff',
  
  // Card and Surface Colors
  card: '#ffffff',
  cardForeground: '#1F2937',
  
  // Secondary Colors
  secondary: '#F8FAFC',
  secondaryForeground: '#1F2937',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  
  // Accent Colors
  accent: '#3B82F6',
  accentForeground: '#ffffff',
  success: '#10B981',
  warning: '#F59E0B',
  destructive: '#EF4444',
  destructiveForeground: '#ffffff',
  
  // Border and Input
  border: 'rgba(0, 0, 0, 0.08)',
  input: 'transparent',
  inputBackground: '#F8FAFC',
  ring: '#3B82F6',
  
  // V3 Brand Color Palette
  brand: {
    // Green Shades (Health/Success)
    emerald50: '#ECFDF5',
    emerald100: '#D1FAE5',
    emerald200: '#A7F3D0',
    emerald300: '#6EE7B7',
    emerald400: '#34D399',
    emerald500: '#10B981',
    
    // Blue Shades (Primary Accent)
    blue50: '#EFF6FF',
    blue100: '#DBEAFE',
    blue200: '#BFDBFE',
    blue300: '#93C5FD',
    blue400: '#60A5FA',
    blue500: '#3B82F6',
    
    // Purple Shades (Premium)
    violet50: '#F5F3FF',
    violet100: '#EDE9FE',
    violet200: '#DDD6FE',
    violet300: '#C4B5FD',
    violet400: '#A78BFA',
    violet500: '#8B5CF6',
    
    // Red Shades (Warnings/Expiry)
    red50: '#FEF2F2',
    red100: '#FEE2E2',
    red200: '#FECACA',
    red300: '#FCA5A5',
    red400: '#F87171',
    red500: '#EF4444',
    
    // Gray Shades (Neutrals)
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#64748B',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
  },
  
  // Gradients (for LinearGradient components)
  gradientPrimary: ['#3B82F6', '#8B5CF6'],
  gradientSubtle: ['#F8FAFC', '#F1F5F9'],
  gradientCTA: ['#10B981', '#3B82F6', '#8B5CF6'], // Green to Blue to Purple
  gradientBackground: ['#ECFDF5', '#EFF6FF', '#F5F3FF'], // Subtle brand gradient
  
  // Dark Mode (V3 Dark Theme)
  dark: {
    background: '#000000',
    foreground: '#FFFFFF',
    card: '#1C1C1E',
    cardForeground: '#FFFFFF',
    primary: '#FFFFFF',
    primaryForeground: '#000000',
    secondary: '#2C2C2E',
    secondaryForeground: '#FFFFFF',
    muted: '#2C2C2E',
    mutedForeground: '#8E8E93',
    border: 'rgba(255, 255, 255, 0.1)',
    input: '#2C2C2E',
    ring: '#0A84FF',
  }
}

export const Typography = {
  // Font Families
  fontBrand: 'System', // Will fallback to system font on mobile
  fontBody: 'System',
  
  // Font Sizes
  sizes: {
    hero: 32,
    section: 22,
    subsection: 18,
    base: 16,
    caption: 14,
    small: 12,
  },
  
  // Font Weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  }
}

export const Spacing = {
  // Base spacing scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Component-specific spacing
  cardPadding: 20,
  screenPadding: 24,
  buttonPadding: 16,
}

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 9999, // For fully rounded elements
}

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
}

export const Layout = {
  // iOS Safe Areas and dimensions
  statusBarHeight: 54,
  navigationHeight: 88,
  homeIndicatorHeight: 34,
  minTouchTarget: 44,
  
  // Common layout values
  containerMaxWidth: 400,
  cardMinHeight: 120,
}