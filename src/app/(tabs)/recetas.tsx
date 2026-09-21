import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated-pressable';
import { HeaderBand } from '@/components/header-band';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { type Receta, crearReceta, listarRecetas } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';

export default function RecetasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    listarRecetas()
      .then(setRecetas)
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const nuevaReceta = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const id = await crearReceta('Nueva receta');
    router.push(`/receta/${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <HeaderBand
        title="Recetas"
        right={
          <AnimatedPressable
            onPress={nuevaReceta}
            style={[styles.addButton, Shadows.button as object, { backgroundColor: theme.tint }]}
            scaleTo={0.88}
            hitSlop={8}>
            <Ionicons name="add" size={26} color={theme.inkText} />
          </AnimatedPressable>
        }>
        {recetas.length > 0 && (
          <ThemedText themeColor="inkTextSecondary" type="small" style={styles.count}>
            {recetas.length} {recetas.length === 1 ? 'receta guardada' : 'recetas guardadas'}
          </ThemedText>
        )}
      </HeaderBand>

      {!cargando && recetas.length === 0 && (
        <Animated.View entering={FadeIn.duration(320)} style={styles.empty}>
          <View style={[styles.emptyIconWrap, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="restaurant-outline" size={40} color={theme.tint} />
          </View>
          <ThemedText type="smallBold">Sin recetas todavía</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Toca + para armar la primera: busca alimentos y suma su valor nutricional.
          </ThemedText>
        </Animated.View>
      )}

      <FlatList
        data={recetas}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 55).springify().damping(13).mass(0.7)}>
            <AnimatedPressable
              onPress={() => router.push(`/receta/${item.id}`)}
              style={[styles.card, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.icon, { backgroundColor: theme.tintSoft }]}>
                <Ionicons name="restaurant" size={20} color={theme.tint} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="smallBold">{item.nombre}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(item.creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </AnimatedPressable>
          </Animated.View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  count: { marginTop: -Spacing.one },
  list: { padding: Spacing.three, paddingTop: Spacing.four, gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyText: { textAlign: 'center' },
});
