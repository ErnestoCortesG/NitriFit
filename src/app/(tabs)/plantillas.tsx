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
import { type Plantilla, listarPlantillas } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { STICKERS, fondoColorPlano, fondoInfo, fuenteInfo } from '@/lib/plantillas';

export default function PlantillasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    listarPlantillas()
      .then(setPlantillas)
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const nuevaPlantilla = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/plantilla/nuevo');
  };

  return (
    <ThemedView style={styles.container}>
      <HeaderBand
        title="Plantillas"
        right={
          <AnimatedPressable
            onPress={nuevaPlantilla}
            style={[styles.addButton, Shadows.button as object, { backgroundColor: theme.tint }]}
            scaleTo={0.88}
            hitSlop={8}>
            <Ionicons name="add" size={26} color={theme.ink} />
          </AnimatedPressable>
        }>
        {plantillas.length > 0 && (
          <ThemedText themeColor="inkTextSecondary" type="small" style={styles.count}>
            {plantillas.length} {plantillas.length === 1 ? 'plantilla guardada' : 'plantillas guardadas'}
          </ThemedText>
        )}
      </HeaderBand>

      {!cargando && plantillas.length === 0 && (
        <Animated.View entering={FadeIn.duration(320)} style={styles.empty}>
          <View style={[styles.emptyIconWrap, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="color-palette" size={40} color={theme.tint} />
          </View>
          <ThemedText type="smallBold">Sin plantillas todavía</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Toca + para diseñar un estilo (fondo, tipografía, marca de agua, sticker) y usarlo al exportar tus recetas.
          </ThemedText>
        </Animated.View>
      )}

      <FlatList
        data={plantillas}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const sticker = STICKERS.find((s) => s.key === item.sticker);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 55).springify().damping(13).mass(0.7)}>
              <AnimatedPressable
                onPress={() => router.push(`/plantilla/${item.id}`)}
                style={[styles.card, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: fondoColorPlano(fondoInfo(item.fondoReceta)), borderColor: theme.border },
                  ]}>
                  {sticker && <Ionicons name={sticker.ionicon as any} size={16} color={theme.tint} />}
                </View>
                <View style={styles.cardInfo}>
                  <ThemedText type="smallBold" style={{ fontFamily: fuenteInfo(item.fuente).headingFontFamily }}>
                    {item.nombre}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {fuenteInfo(item.fuente).label}
                    {item.marcaAguaTexto ? ' · con marca de agua' : ''}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </AnimatedPressable>
            </Animated.View>
          );
        }}
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
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
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
