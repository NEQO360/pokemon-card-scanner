import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Modern, clean color palette with subtle Pokemon touches
export const colors = {
  // Primary Pokemon Red - used sparingly for key actions
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#dc2626', // Pokemon Red - primary action color
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#450a0a',
  },
  
  // Clean grays for professional hierarchy
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Subtle Pokemon type colors for accents only
  pokemon: {
    electric: '#fbbf24', // Subtle yellow
    fire: '#f97316',     // Refined orange
    water: '#3b82f6',    // Clean blue
    grass: '#10b981',    // Modern green
    psychic: '#a855f7',  // Elegant purple
    ice: '#06b6d4',      // Cool cyan
    dragon: '#8b5cf6',   // Royal purple
    dark: '#6b7280',     // Professional gray
    fighting: '#dc2626', // Primary red
    poison: '#8b5cf6',   // Elegant purple
    ground: '#d97706',   // Earth tone
    flying: '#6366f1',   // Sky blue
    bug: '#84cc16',      // Fresh green
    rock: '#a3a3a3',     // Stone gray
    ghost: '#7c3aed',    // Mystical purple
    steel: '#64748b',    // Modern steel
    fairy: '#ec4899',    // Soft pink
    normal: '#6b7280',   // Neutral gray
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#3b82f6',
  
  // Professional surface colors
  surface: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    accent: 'rgba(220, 38, 38, 0.05)',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text hierarchy
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6b7280',
    inverse: '#ffffff',
    accent: '#dc2626',
  },
  
  // Border colors
  border: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

// Professional typography system
export const typography = {
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Clean, readable font sizes
  sizes: {
    xs: 12,    // Small labels
    sm: 14,    // Secondary text
    base: 16,  // Body text
    lg: 18,    // Large body
    xl: 20,    // Small headings
    '2xl': 24, // Medium headings
    '3xl': 30, // Large headings
    '4xl': 36, // Hero text
    '5xl': 48, // Display text
  },
  
  // Proper line heights for readability
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  
  // Subtle letter spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
};

// Consistent spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Modern, consistent border radius
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Professional shadow system
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Smooth, purposeful animations
export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    default: 'ease-out',
    bounce: 'ease-in-out',
    smooth: 'ease-out',
  },
  
  spring: {
    tension: 100,
    friction: 8,
  },
};

// Layout constants for consistent design
export const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  headerHeight: 60,
  tabBarHeight: 48,
  buttonHeight: 48,
  cardWidth: Math.min(240, SCREEN_WIDTH * 0.6),
  cardHeight: Math.min(336, (SCREEN_WIDTH * 0.6) * 1.4),
  maxContentWidth: 400,
  containerPadding: 16,
};

// Clean, professional theme
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animation,
  layout,
  
  // Utility functions for consistent styling
  utils: {
    getCardStyle: () => ({
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.md,
      padding: spacing.md,
      ...shadows.card,
    }),
    
    getButtonStyle: (variant: 'primary' | 'secondary' = 'primary') => ({
      backgroundColor: variant === 'primary' ? colors.primary[500] : colors.surface.secondary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      ...shadows.button,
    }),

    // Pokemon type colors for theming
    getTypeColor: (type: string): string => {
      const typeColors: { [key: string]: string } = {
        electric: '#FFD700',  // Gold
        fire: '#FF6B35',      // Red-Orange
        water: '#4A90E2',     // Blue
        grass: '#7ED321',     // Green
        psychic: '#BD10E0',   // Purple
        ice: '#50E3C2',       // Cyan
        dragon: '#7B68EE',    // Slate Blue
        dark: '#4A4A4A',      // Dark Gray
        fighting: '#D0021B',  // Red
        poison: '#9013FE',    // Deep Purple
        ground: '#8B4513',    // Saddle Brown
        flying: '#87CEEB',    // Sky Blue
        bug: '#9ACD32',       // Yellow Green
        rock: '#A0522D',      // Sienna
        ghost: '#6A0DAD',     // Blue Violet
        steel: '#708090',     // Slate Gray
        fairy: '#FFB6C1',     // Light Pink
        normal: '#A8A878',    // Beige
      };
      return typeColors[type?.toLowerCase()] || typeColors.normal;
    },

    // Convert hex to rgba
    hexToRgba: (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
  },
};

export default theme;

// Cinematic effects configuration
export const effects = {
  particles: {
    count: 50,
    speed: 0.5,
    size: 4,
    opacity: 0.6,
  },
  
  holographic: {
    intensity: 0.8,
    speed: 0.3,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
  },
  
  atmosphere: {
    layers: 3,
    opacity: 0.1,
    blur: 20,
  },
  
  glow: {
    intensity: 0.3,
    radius: 10,
    spread: 5,
  },
}; 