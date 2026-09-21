import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/contexts/theme-preference';

export function useTheme() {
  const { resolved } = useThemePreference();
  return Colors[resolved];
}
