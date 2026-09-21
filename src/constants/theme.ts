/**
 * Paleta de marca de NutriFit — "clínico, cálido, con oficio". Grafito cálido
 * + terracota (nada de verde-menta genérico de app de salud), con Fraunces
 * (serif, encabezados) + Inter (sans, cuerpo) para un tono editorial/profesional.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1B1A',
    textSecondary: '#746C60',
    background: '#D6C09A',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#C7AE85',
    border: '#CBB68C',
    ink: '#1C1B1A',
    inkText: '#F5F1EA',
    inkTextSecondary: '#B8AFA0',
    tint: '#C9642B',
    tintSoft: '#F3E1D2',
    accent: '#6B7A4F',
    accentSoft: '#E7EBDD',
    danger: '#B23A3A',
    dangerSoft: '#F5DEDA',
  },
  dark: {
    text: '#F5F1EA',
    textSecondary: '#B8AFA0',
    background: '#161514',
    backgroundElement: '#625848',
    backgroundSelected: '#453D32',
    border: '#6E624F',
    ink: '#0F0E0D',
    inkText: '#F5F1EA',
    inkTextSecondary: '#8F887C',
    tint: '#E08A4F',
    tintSoft: '#3A2A1E',
    accent: '#8FA06B',
    accentSoft: '#293221',
    danger: '#E27575',
    dangerSoft: '#3A2323',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  default: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemiBold: 'Inter_600SemiBold',
    serif: 'Fraunces_600SemiBold',
    serifBold: 'Fraunces_700Bold',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter_400Regular, system-ui',
    sansMedium: 'Inter_500Medium, system-ui',
    sansSemiBold: 'Inter_600SemiBold, system-ui',
    serif: 'Fraunces_600SemiBold, serif',
    serifBold: 'Fraunces_700Bold, serif',
    mono: 'monospace',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 14,
  large: 22,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Sombras "tarjeta de papel" — sin esto todo se ve pegado a la superficie.
// Android usa `elevation`; iOS necesita las 4 props shadow* por separado.
export const Shadows = {
  card: Platform.select({
    android: { elevation: 3 },
    default: {
      shadowColor: '#1C1B1A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
  }),
  button: Platform.select({
    android: { elevation: 5 },
    default: {
      shadowColor: '#1C1B1A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
    },
  }),
  header: Platform.select({
    android: { elevation: 8 },
    default: {
      shadowColor: '#1C1B1A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
    },
  }),
} as const;
