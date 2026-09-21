import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Radius } from '@/constants/theme';
import { useThemePreference } from '@/contexts/theme-preference';
import { useTheme } from '@/hooks/use-theme';

/**
 * Botón que alterna manualmente entre modo claro y oscuro, independiente del
 * ajuste del sistema — permite probar/usar ambos sin salir de la app.
 */
export function ThemeToggleButton() {
  const theme = useTheme();
  const { resolved, setPreference } = useThemePreference();
  const esOscuro = resolved === 'dark';

  const rotation = useAnimatedStyle(() => ({
    transform: [{ rotate: withSpring(esOscuro ? '180deg' : '0deg', { damping: 12, stiffness: 140 }) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPreference(esOscuro ? 'light' : 'dark');
      }}
      style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
      <Animated.View style={rotation}>
        <Ionicons name={esOscuro ? 'moon' : 'sunny'} size={20} color={theme.tint} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
