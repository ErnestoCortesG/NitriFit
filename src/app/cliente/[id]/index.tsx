import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AnimatedCounter } from '@/components/animated-counter';
import { AnimatedPressable } from '@/components/animated-pressable';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import {
  type Cliente,
  type HistorialEntry,
  type Receta,
  agregarHistorial,
  crearReceta,
  eliminarCliente,
  listarHistorial,
  listarRecetasCliente,
  obtenerCliente,
} from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { ACTIVIDAD_LABEL, calcularGastoEstimado, calcularIMC, calcularTMB } from '@/lib/calculos';

function StatCard({
  label,
  value,
  decimals,
  suffix,
  sub,
  delay,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  sub?: string;
  delay: number;
}) {
  const theme = useTheme();
  // Memoizado: si se crea inline, Reanimated recibe un objeto de animación
  // nuevo en cada render del padre (ej. al escribir en el campo de nota) y
  // vuelve a reproducir la animación de entrada — se ve como si la tarjeta
  // "recalculara" el valor una y otra vez, aunque el valor no haya cambiado.
  const entrada = useMemo(() => FadeInUp.delay(delay).springify().damping(13).mass(0.7), [delay]);
  return (
    <Animated.View
      entering={entrada}
      style={[styles.statCard, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
      <AnimatedCounter value={value} decimals={decimals} suffix={suffix} type="title" style={styles.statValue} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {sub && (
        <ThemedText type="small" themeColor="textSecondary">
          {sub}
        </ThemedText>
      )}
    </Animated.View>
  );
}

export default function ClienteDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const theme = useTheme();
  const router = useRouter();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [nota, setNota] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>([]);

  const cargar = useCallback(() => {
    obtenerCliente(clienteId).then(setCliente);
    listarHistorial(clienteId).then(setHistorial);
    listarRecetasCliente(clienteId).then(setRecetas);
  }, [clienteId]);

  useFocusEffect(cargar);

  if (!cliente) {
    return <ThemedView style={styles.container} />;
  }

  const imc = calcularIMC(cliente.pesoKg, cliente.tallaCm);
  const tmb = calcularTMB(cliente.pesoKg, cliente.tallaCm, cliente.edad, cliente.sexo);
  const gasto = calcularGastoEstimado(tmb, cliente.actividadTipo);

  const confirmarEliminar = () => {
    Alert.alert('Eliminar cliente', `¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await eliminarCliente(clienteId);
          router.back();
        },
      },
    ]);
  };

  const guardarNota = async () => {
    if (!nota.trim()) return;
    await agregarHistorial(clienteId, 'nota', nota.trim());
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setNota('');
    cargar();
  };

  const nuevaReceta = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const id = await crearReceta(`Receta de ${cliente.nombre}`, clienteId);
    router.push(`/receta/${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: cliente.nombre,
          headerRight: () => (
            <View style={styles.headerActions}>
              <AnimatedPressable onPress={() => router.push(`/cliente/${clienteId}/editar`)} hitSlop={8}>
                <Ionicons name="create-outline" size={22} color={theme.tint} />
              </AnimatedPressable>
              <AnimatedPressable onPress={confirmarEliminar} hitSlop={8}>
                <Ionicons name="trash-outline" size={22} color={theme.danger} />
              </AnimatedPressable>
            </View>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        onScrollBeginDrag={() => Keyboard.dismiss()}>
        <ThemedText type="small" themeColor="textSecondary">
          {cliente.sexo === 'F' ? 'Femenino' : 'Masculino'} · {cliente.edad} años · {cliente.pesoKg} kg ·{' '}
          {cliente.tallaCm} cm
          {cliente.pliegueMm != null ? ` · pliegues ${cliente.pliegueMm} mm` : ''}
        </ThemedText>

        <View style={styles.statsRow}>
          <StatCard label={`IMC · ${imc.categoria}`} value={imc.valor} decimals={1} delay={60} />
          <StatCard label="TMB · reposo (kcal/día)" value={tmb} delay={120} />
        </View>

        {cliente.actividadTipo && (
          <Animated.View
            entering={FadeInDown.delay(180).springify().damping(16)}
            style={[styles.infoBox, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="small" themeColor="accent">
              {ACTIVIDAD_LABEL[cliente.actividadTipo]}
              {cliente.actividadFrecuencia != null ? ` · ${cliente.actividadFrecuencia} días/sem` : ''}
            </ThemedText>
            {gasto != null && (
              <>
                <ThemedText type="smallBold" themeColor="accent">
                  Gasto calórico estimado: {gasto} kcal/día
                </ThemedText>
                <ThemedText type="small" themeColor="accent">
                  Incluye tu actividad física + TMB
                </ThemedText>
              </>
            )}
          </Animated.View>
        )}

        <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
          <ThemedText type="smallBold">Recetas</ThemedText>
          <AnimatedPressable onPress={nuevaReceta} scaleTo={0.9} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={22} color={theme.tint} />
          </AnimatedPressable>
        </View>

        {recetas.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin recetas todavía para este cliente.
          </ThemedText>
        ) : (
          recetas.map((r, i) => (
            <Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i, 6) * 40)}>
              <AnimatedPressable
                onPress={() => router.push(`/receta/${r.id}`)}
                style={[styles.recetaCard, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.recetaIcon, { backgroundColor: theme.tintSoft }]}>
                  <Ionicons name="restaurant" size={18} color={theme.tint} />
                </View>
                <View style={styles.cardInfo}>
                  <ThemedText type="smallBold">{r.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {new Date(r.creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </AnimatedPressable>
            </Animated.View>
          ))
        )}

        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold">Notas</ThemedText>
        </View>

        <View style={styles.notaRow}>
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Agregar una nota de avance…"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.notaInput,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
            multiline
          />
          <AnimatedPressable
            onPress={guardarNota}
            style={[styles.notaButton, Shadows.button as object, { backgroundColor: theme.tint }]}
            scaleTo={0.88}
            hitSlop={8}>
            <Ionicons name="send" size={18} color={theme.ink} />
          </AnimatedPressable>
        </View>

        {historial.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin actividad registrada todavía.
          </ThemedText>
        ) : (
          historial.map((h, i) => (
            <Animated.View
              key={h.id}
              entering={FadeInDown.delay(Math.min(i, 6) * 40)}
              style={[styles.historialItem, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(h.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </ThemedText>
              <ThemedText type="small">{h.contenido}</ThemedText>
            </Animated.View>
          ))
        )}
      </ScrollView>
      <HideKeyboardButton />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.three },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: 2 },
  statValue: { fontSize: 30, lineHeight: 34 },
  infoBox: { borderRadius: Radius.medium, padding: Spacing.three, gap: 4 },
  sectionHeader: { marginTop: Spacing.two },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.medium,
  },
  recetaIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  notaRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  notaInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
    minHeight: 44,
  },
  notaButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historialItem: { borderRadius: Radius.small, padding: Spacing.two, gap: 2 },
});
