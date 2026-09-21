import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import type { Plantilla } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { STICKERS, fondoColorPlano, fondoInfo, fuenteInfo } from '@/lib/plantillas';

/**
 * Selector de plantilla al exportar — reemplaza Alert.alert, que en iOS se
 * ve como un popup genérico del sistema (fuente/tamaños del OS) y no como
 * parte de la app.
 */
export function PlantillaPickerSheet({
  visible,
  plantillas,
  onSelect,
  onClose,
}: {
  visible: boolean;
  plantillas: Plantilla[];
  onSelect: (plantilla: Plantilla | null) => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  const elegir = (p: Plantilla | null) => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    onSelect(p);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, Shadows.header as object, { backgroundColor: theme.backgroundElement }]}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.handle} />
          <ThemedText type="smallBold" style={styles.title}>
            Exportar con qué plantilla
          </ThemedText>

          <ScrollView style={styles.list} bounces={false}>
            <AnimatedPressable
              onPress={() => elegir(null)}
              style={[styles.row, { borderColor: theme.border }]}
              scaleTo={0.98}>
              <View style={[styles.swatch, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="document-outline" size={18} color={theme.textSecondary} />
              </View>
              <View style={styles.rowInfo}>
                <ThemedText type="smallBold">Sin plantilla</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Estilo por defecto de NutriFit
                </ThemedText>
              </View>
            </AnimatedPressable>

            {plantillas.map((p) => {
              const sticker = STICKERS.find((s) => s.key === p.sticker);
              return (
                <AnimatedPressable
                  key={p.id}
                  onPress={() => elegir(p)}
                  style={[styles.row, { borderColor: theme.border }]}
                  scaleTo={0.98}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: fondoColorPlano(fondoInfo(p.fondoReceta)), borderColor: theme.border },
                    ]}>
                    {sticker && <Ionicons name={sticker.ionicon as any} size={16} color={theme.tint} />}
                  </View>
                  <View style={styles.rowInfo}>
                    <ThemedText type="smallBold" style={{ fontFamily: fuenteInfo(p.fuente).headingFontFamily }}>
                      {p.nombre}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {fuenteInfo(p.fuente).label}
                    </ThemedText>
                  </View>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <AnimatedPressable
            onPress={onClose}
            style={[styles.cancelar, { backgroundColor: theme.backgroundSelected }]}
            scaleTo={0.97}>
            <ThemedText type="smallBold">Cancelar</ThemedText>
          </AnimatedPressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,120,0.35)',
    marginBottom: Spacing.two,
  },
  title: { marginBottom: Spacing.two },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 2 },
  cancelar: {
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
});
