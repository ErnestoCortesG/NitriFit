import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { HeaderBand } from '@/components/header-band';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Proximamente({
  icono,
  titulo,
  descripcion,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <HeaderBand title={titulo} />
      <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(13).mass(0.7)}
          style={[styles.iconWrap, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name={icono} size={40} color={theme.tint} />
        </Animated.View>
        <ThemedText type="smallBold">Próximamente</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.desc}>
          {descripcion}
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  desc: { textAlign: 'center' },
});
