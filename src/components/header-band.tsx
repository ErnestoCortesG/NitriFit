import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Banda "héroe" en grafito para el encabezado de cada tab — sin esto el color
 * de marca solo vivía en la tab bar (una franja delgada) y el resto de la
 * pantalla se sentía plano. Comprometemos superficie de verdad aquí.
 */
export function HeaderBand({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.band, Shadows.header as ViewStyle, { backgroundColor: theme.ink }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.row}>
          <ThemedText type="title" themeColor="inkText" style={styles.title}>
            {title}
          </ThemedText>
          <View style={styles.actions}>
            <ThemeToggleButton />
            {right}
          </View>
        </View>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    borderBottomLeftRadius: Radius.large,
    borderBottomRightRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    zIndex: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.two },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 34, lineHeight: 40 },
});
