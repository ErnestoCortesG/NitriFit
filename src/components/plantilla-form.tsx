import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type {
  FuentePlantilla,
  IntensidadMarcaAgua,
  NuevaPlantilla,
  Plantilla,
  TamanoFuentePlantilla,
} from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { FONDOS, FUENTES, STICKERS, TAMANOS, type FondoInfo, fondoInfo, fuenteInfo, tamanoInfo } from '@/lib/plantillas';

export interface PlantillaFormValue {
  nombre: string;
  fondoReceta: string;
  fondoRutina: string;
  fuente: FuentePlantilla;
  tamanoFuente: TamanoFuentePlantilla;
  marcaAguaTexto: string;
  marcaAguaIntensidad: IntensidadMarcaAgua;
  sticker: string | null;
}

export function plantillaFormValueInicial(p?: Plantilla): PlantillaFormValue {
  if (!p) {
    return {
      nombre: '',
      fondoReceta: FONDOS[0].key,
      fondoRutina: FONDOS[0].key,
      fuente: 'editorial',
      tamanoFuente: 'mediano',
      marcaAguaTexto: '',
      marcaAguaIntensidad: 'sutil',
      sticker: null,
    };
  }
  return {
    nombre: p.nombre,
    fondoReceta: p.fondoReceta,
    fondoRutina: p.fondoRutina,
    fuente: p.fuente,
    tamanoFuente: p.tamanoFuente,
    marcaAguaTexto: p.marcaAguaTexto ?? '',
    marcaAguaIntensidad: p.marcaAguaIntensidad,
    sticker: p.sticker,
  };
}

export function parsePlantillaForm(v: PlantillaFormValue): NuevaPlantilla | null {
  if (!v.nombre.trim()) return null;
  return {
    nombre: v.nombre.trim(),
    fondoReceta: v.fondoReceta,
    fondoRutina: v.fondoRutina,
    fuente: v.fuente,
    tamanoFuente: v.tamanoFuente,
    marcaAguaTexto: v.marcaAguaTexto.trim() || null,
    marcaAguaIntensidad: v.marcaAguaIntensidad,
    sticker: v.sticker,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

// Posiciones fijas (% del cuadro) para tiles del patrón ilustrado en la vista previa RN.
const PATRON_POSICIONES = [
  { top: '10%', left: '8%' },
  { top: '55%', left: '78%' },
  { top: '72%', left: '20%' },
];

function PreviewMini({ titulo, fondoKey, value }: { titulo: string; fondoKey: string; value: PlantillaFormValue }) {
  const fondo = fondoInfo(fondoKey);
  const fuente = fuenteInfo(value.fuente);
  const tamano = tamanoInfo(value.tamanoFuente);
  const sticker = STICKERS.find((s) => s.key === value.sticker);
  const bg = fondo.hex ?? fondo.baseHex ?? '#FFFFFF';

  return (
    <View style={styles.previewWrap}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.previewLabel}>
        {titulo}
      </ThemedText>
      <View style={[styles.preview, { backgroundColor: bg }]}>
        {fondo.tipo === 'imagen' &&
          fondo.iconos?.map((icono, i) => (
            <Ionicons
              key={i}
              name={icono as any}
              size={22}
              color={fondo.patronColor}
              style={[styles.previewPatronIcon, PATRON_POSICIONES[i % PATRON_POSICIONES.length] as any, { opacity: 0.35 }]}
            />
          ))}
        {value.marcaAguaTexto.trim() && (
          <ThemedText
            numberOfLines={1}
            style={[
              styles.previewWatermark,
              {
                fontFamily: fuente.headingFontFamily,
                color: '#1C1B1A',
                lineHeight: 30,
                opacity: value.marcaAguaIntensidad === 'visible' ? 0.16 : 0.08,
              },
            ]}>
            {value.marcaAguaTexto}
          </ThemedText>
        )}
        <ThemedText
          style={[
            styles.previewTitle,
            { fontFamily: fuente.headingFontFamily, fontSize: tamano.headingPx * 0.7, lineHeight: tamano.headingPx * 0.7 * 1.2, color: '#1C1B1A' },
          ]}>
          Ejemplo
        </ThemedText>
        <ThemedText
          style={[
            styles.previewBody,
            { fontFamily: fuente.bodyFontFamily, fontSize: tamano.bodyPx, lineHeight: tamano.bodyPx * 1.5, color: '#746C60' },
          ]}>
          Así se ve el cuerpo del documento.
        </ThemedText>
        {sticker && (
          <View style={styles.previewSticker}>
            <Ionicons name={sticker.ionicon as any} size={22} color="#FF7A29" />
          </View>
        )}
      </View>
    </View>
  );
}

function Swatch({ fondo, selected, onPress }: { fondo: FondoInfo; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const bg = fondo.hex ?? fondo.baseHex ?? '#FFFFFF';
  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      scaleTo={0.9}
      style={[
        styles.swatch,
        { backgroundColor: bg, borderColor: selected ? theme.tint : theme.border, borderWidth: selected ? 3 : 1 },
      ]}>
      {fondo.tipo === 'imagen' && fondo.iconos && (
        <Ionicons name={fondo.iconos[0] as any} size={14} color={fondo.patronColor} />
      )}
    </AnimatedPressable>
  );
}

function Chip({ label, selected, onPress, fontFamily }: { label: string; selected: boolean; onPress: () => void; fontFamily?: string }) {
  const theme = useTheme();
  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      scaleTo={0.95}
      style={[
        styles.chip,
        { backgroundColor: selected ? theme.tint : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
      ]}>
      <ThemedText type="small" style={[selected ? { color: theme.ink } : undefined, fontFamily ? { fontFamily } : undefined]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function IconChip({ name, selected, onPress }: { name: string | null; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      scaleTo={0.9}
      style={[
        styles.iconChip,
        { backgroundColor: selected ? theme.tint : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
      ]}>
      <Ionicons name={(name ?? 'close') as any} size={18} color={selected ? theme.ink : theme.textSecondary} />
    </AnimatedPressable>
  );
}

export function PlantillaForm({
  value,
  onChange,
  footer,
}: {
  value: PlantillaFormValue;
  onChange: (v: PlantillaFormValue) => void;
  footer?: React.ReactNode;
}) {
  const theme = useTheme();
  const set = <K extends keyof PlantillaFormValue>(key: K, val: PlantillaFormValue[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      onScrollBeginDrag={() => Keyboard.dismiss()}>
      <View style={styles.previewRow}>
        <PreviewMini titulo="Receta" fondoKey={value.fondoReceta} value={value} />
        <PreviewMini titulo="Rutina" fondoKey={value.fondoRutina} value={value} />
      </View>

      <Field label="Nombre">
        <TextInput
          value={value.nombre}
          onChangeText={(t) => set('nombre', t)}
          placeholder="Ej. Plan clásico"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        />
      </Field>

      <Field label="Fondo de recetas">
        <View style={styles.wrap}>
          {FONDOS.map((f) => (
            <Swatch key={f.key} fondo={f} selected={value.fondoReceta === f.key} onPress={() => set('fondoReceta', f.key)} />
          ))}
        </View>
      </Field>

      <Field label="Fondo de rutinas">
        <View style={styles.wrap}>
          {FONDOS.map((f) => (
            <Swatch key={f.key} fondo={f} selected={value.fondoRutina === f.key} onPress={() => set('fondoRutina', f.key)} />
          ))}
        </View>
      </Field>

      <Field label="Fuente">
        <View style={styles.wrap}>
          {FUENTES.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              fontFamily={f.headingFontFamily}
              selected={value.fuente === f.key}
              onPress={() => set('fuente', f.key)}
            />
          ))}
        </View>
      </Field>

      <Field label="Tamaño de fuente">
        <View style={styles.wrap}>
          {TAMANOS.map((t) => (
            <Chip key={t.key} label={t.label} selected={value.tamanoFuente === t.key} onPress={() => set('tamanoFuente', t.key)} />
          ))}
        </View>
      </Field>

      <Field label="Marca de agua — opcional">
        <TextInput
          value={value.marcaAguaTexto}
          onChangeText={(t) => set('marcaAguaTexto', t)}
          placeholder="Ej. Nutrióloga Ana Pérez"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        />
      </Field>

      {value.marcaAguaTexto.trim().length > 0 && (
        <Field label="Intensidad de la marca de agua">
          <View style={styles.row}>
            <Chip label="Sutil" selected={value.marcaAguaIntensidad === 'sutil'} onPress={() => set('marcaAguaIntensidad', 'sutil')} />
            <Chip
              label="Visible"
              selected={value.marcaAguaIntensidad === 'visible'}
              onPress={() => set('marcaAguaIntensidad', 'visible')}
            />
          </View>
        </Field>
      )}

      <Field label="Sticker — opcional">
        <View style={styles.wrap}>
          <IconChip name="close" selected={value.sticker === null} onPress={() => set('sticker', null)} />
          {STICKERS.map((s) => (
            <IconChip key={s.key} name={s.ionicon} selected={value.sticker === s.key} onPress={() => set('sticker', s.key)} />
          ))}
        </View>
      </Field>

      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  field: { gap: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: { flexDirection: 'row', gap: Spacing.two },
  previewWrap: { flex: 1, gap: 4 },
  previewLabel: { marginLeft: 2 },
  preview: {
    borderRadius: Radius.medium,
    padding: Spacing.two,
    minHeight: 110,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewTitle: { fontFamily: Fonts.serifBold, marginBottom: 4 },
  previewBody: { fontFamily: Fonts.sans },
  previewPatronIcon: { position: 'absolute' },
  previewWatermark: {
    position: 'absolute',
    top: '38%',
    left: -20,
    fontSize: 22,
    transform: [{ rotate: '-22deg' }],
  },
  previewSticker: { position: 'absolute', bottom: Spacing.one, right: Spacing.one },
});
