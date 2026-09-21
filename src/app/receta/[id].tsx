import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedCounter } from '@/components/animated-counter';
import { AnimatedPressable } from '@/components/animated-pressable';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import {
  type Receta,
  type RecetaItem,
  actualizarGramosItem,
  actualizarIndiceGlucemico,
  actualizarPesoPorPieza,
  actualizarPiezasItem,
  agregarRecetaItem,
  cachearAlimentoExterno,
  crearAlimentoManual,
  eliminarReceta,
  eliminarRecetaItem,
  guardarObservaciones,
  listarRecetaItems,
  obtenerCliente,
  obtenerReceta,
  renombrarReceta,
} from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { type AlimentoBusqueda, buscarAlimentos } from '@/lib/alimentos-buscador';
import { pesoPromedioPieza } from '@/lib/alimentos-es';
import { exportarRecetaPdf } from '@/lib/pdf-receta';

type Unidad = 'gramos' | 'piezas';

function useTotales(items: RecetaItem[]) {
  return useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          const f = it.gramos / 100;
          acc.calorias += it.alimento.calorias100g * f;
          acc.proteina += it.alimento.proteina100g * f;
          acc.carbohidratos += it.alimento.carbohidratos100g * f;
          acc.grasa += it.alimento.grasa100g * f;
          return acc;
        },
        { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0 }
      ),
    [items]
  );
}

export default function RecetaEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recetaId = Number(id);
  const theme = useTheme();
  const router = useRouter();

  const [receta, setReceta] = useState<Receta | null>(null);
  const [items, setItems] = useState<RecetaItem[]>([]);
  const [nombre, setNombre] = useState('');
  const [observaciones, setObservaciones] = useState('');
  // Si esta receta pertenece a un cliente, se muestra su nombre para que sea
  // claro de dónde vino (aunque no aparezca en el módulo general de Recetas).
  const [clienteNombre, setClienteNombre] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<AlimentoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [pendiente, setPendiente] = useState<AlimentoBusqueda | null>(null);
  const [gramos, setGramos] = useState('100');
  const [unidadPendiente, setUnidadPendiente] = useState<Unidad>('gramos');
  const [piezasInput, setPiezasInput] = useState('1');
  // Peso de 1 pieza (g) sugerido para el alimento pendiente — null si este
  // alimento normalmente no se cuenta por pieza (la mayoría se pesa).
  const pesoPiezaPendiente = pendiente ? pesoPromedioPieza(pendiente.nombre) : null;
  const [manualAbierto, setManualAbierto] = useState(false);
  const [manual, setManual] = useState({ nombre: '', calorias: '', proteina: '', carbohidratos: '', grasa: '' });
  const [igEditando, setIgEditando] = useState<RecetaItem | null>(null);
  const [igCrudoInput, setIgCrudoInput] = useState('');
  const [igCocidoInput, setIgCocidoInput] = useState('');
  const [unidadEditando, setUnidadEditando] = useState<RecetaItem | null>(null);
  const [unidadEditorTipo, setUnidadEditorTipo] = useState<Unidad>('gramos');
  const [pesoPiezaInput, setPesoPiezaInput] = useState('');
  const [cantidadPiezaInput, setCantidadPiezaInput] = useState('');
  const [comidaSeleccionada, setComidaSeleccionada] = useState(1);
  // Comidas ya creadas en esta sesión — se mantienen en la lista de chips
  // aunque estén vacías, para poder navegar de vuelta a ellas.
  const [comidasConocidas, setComidasConocidas] = useState<number[]>([1]);

  const cargar = useCallback(async () => {
    const r = await obtenerReceta(recetaId);
    if (r) {
      setReceta(r);
      setNombre(r.nombre);
      setObservaciones(r.observaciones ?? '');
      if (r.clienteId != null) {
        const c = await obtenerCliente(r.clienteId);
        setClienteNombre(c?.nombre ?? null);
      }
    }
    const nuevosItems = await listarRecetaItems(recetaId);
    setItems(nuevosItems);
    if (nuevosItems.length > 0) {
      setComidasConocidas((prev) =>
        Array.from(new Set([...prev, ...nuevosItems.map((it) => it.comida)])).sort((a, b) => a - b)
      );
    }
  }, [recetaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Búsqueda con debounce — evita disparar una llamada a USDA por cada tecla.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      buscarAlimentos(query.trim())
        .then(setResultados)
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const totales = useTotales(items);

  // Números de "Comida" a mostrar como chips: los ya creados en esta sesión
  // (aunque estén vacíos) más el seleccionado actualmente — así se puede
  // navegar de vuelta a una comida vacía o ya editada.
  const numerosComida = useMemo(() => {
    return Array.from(new Set([...comidasConocidas, comidaSeleccionada])).sort((a, b) => a - b);
  }, [comidasConocidas, comidaSeleccionada]);

  const gruposComida = useMemo(() => {
    return numerosComida.map((n) => ({
      comida: n,
      items: items.filter((it) => it.comida === n),
    }));
  }, [numerosComida, items]);

  const agregarComida = () => {
    const siguiente = Math.max(0, ...numerosComida) + 1;
    setComidasConocidas((prev) => [...prev, siguiente]);
    setComidaSeleccionada(siguiente);
    Haptics.selectionAsync().catch(() => {});
  };

  const confirmarAgregar = async () => {
    if (!pendiente) return;
    let gramosFinal: number;
    let piezasFinal: number | null = null;
    if (unidadPendiente === 'piezas' && pesoPiezaPendiente != null) {
      const cant = parseFloat(piezasInput);
      if (isNaN(cant) || cant <= 0) return;
      piezasFinal = cant;
      gramosFinal = cant * pesoPiezaPendiente;
    } else {
      const g = parseFloat(gramos);
      if (isNaN(g) || g <= 0) return;
      gramosFinal = g;
    }
    try {
      const alimento = await cachearAlimentoExterno(pendiente.fuente, pendiente);
      await agregarRecetaItem(recetaId, alimento.id, gramosFinal, comidaSeleccionada, piezasFinal);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Keyboard.dismiss();
      setPendiente(null);
      setGramos('100');
      setPiezasInput('1');
      setUnidadPendiente('gramos');
      setQuery('');
      setResultados([]);
      await cargar();
    } catch (e) {
      console.error('Error al agregar alimento a la receta:', e);
      Alert.alert('No se pudo agregar', String(e instanceof Error ? e.message : e));
    }
  };

  const agregarManual = async () => {
    const cal = parseFloat(manual.calorias);
    const prot = parseFloat(manual.proteina) || 0;
    const carb = parseFloat(manual.carbohidratos) || 0;
    const gr = parseFloat(manual.grasa) || 0;
    if (!manual.nombre.trim() || isNaN(cal)) return;
    try {
      const alimento = await crearAlimentoManual({
        nombre: manual.nombre.trim(),
        calorias100g: cal,
        proteina100g: prot,
        carbohidratos100g: carb,
        grasa100g: gr,
        igCrudo: null,
        igCocido: null,
      });
      await agregarRecetaItem(recetaId, alimento.id, 100, comidaSeleccionada);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Keyboard.dismiss();
      setManual({ nombre: '', calorias: '', proteina: '', carbohidratos: '', grasa: '' });
      setManualAbierto(false);
      await cargar();
    } catch (e) {
      console.error('Error al agregar alimento manual a la receta:', e);
      Alert.alert('No se pudo agregar', String(e instanceof Error ? e.message : e));
    }
  };

  const cambiarGramos = async (item: RecetaItem, valor: string) => {
    const g = parseFloat(valor);
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, gramos: isNaN(g) ? it.gramos : g } : it)));
    if (!isNaN(g) && g > 0) await actualizarGramosItem(item.id, g);
  };

  const cambiarPiezas = async (item: RecetaItem, valor: string) => {
    const cant = parseFloat(valor);
    const peso = item.alimento.gramosPorPieza;
    if (peso == null) return;
    const gramosNuevos = cant * peso;
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, piezas: isNaN(cant) ? it.piezas : cant, gramos: isNaN(cant) ? it.gramos : gramosNuevos } : it))
    );
    if (!isNaN(cant) && cant > 0) await actualizarPiezasItem(item.id, cant, gramosNuevos);
  };

  const editarUnidad = (item: RecetaItem) => {
    setUnidadEditando(item);
    const pesoSugerido = item.alimento.gramosPorPieza ?? pesoPromedioPieza(item.alimento.nombre);
    setUnidadEditorTipo(item.piezas != null ? 'piezas' : 'gramos');
    setPesoPiezaInput(pesoSugerido != null ? String(pesoSugerido) : '');
    setCantidadPiezaInput(item.piezas != null ? String(item.piezas) : '1');
  };

  const guardarUnidad = async () => {
    if (!unidadEditando) return;
    if (unidadEditorTipo === 'piezas') {
      const peso = parseFloat(pesoPiezaInput);
      const cant = parseFloat(cantidadPiezaInput);
      if (isNaN(peso) || peso <= 0 || isNaN(cant) || cant <= 0) return;
      await actualizarPesoPorPieza(unidadEditando.alimentoId, peso);
      await actualizarPiezasItem(unidadEditando.id, cant, cant * peso);
    } else {
      await actualizarGramosItem(unidadEditando.id, unidadEditando.gramos);
    }
    setUnidadEditando(null);
    Keyboard.dismiss();
    await cargar();
  };

  const quitarItem = async (item: RecetaItem) => {
    await eliminarRecetaItem(item.id);
    Haptics.selectionAsync().catch(() => {});
    cargar();
  };

  const editarIG = (item: RecetaItem) => {
    setIgEditando(item);
    setIgCrudoInput(item.alimento.igCrudo != null ? String(item.alimento.igCrudo) : '');
    setIgCocidoInput(item.alimento.igCocido != null ? String(item.alimento.igCocido) : '');
  };

  const guardarIG = async () => {
    if (!igEditando) return;
    const c = parseFloat(igCrudoInput);
    const k = parseFloat(igCocidoInput);
    await actualizarIndiceGlucemico(igEditando.alimentoId, isNaN(c) ? null : c, isNaN(k) ? null : k);
    setIgEditando(null);
    cargar();
  };

  const [exportando, setExportando] = useState(false);

  const compartirPdf = async () => {
    if (!receta || exportando) return;
    setExportando(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await exportarRecetaPdf(receta, items, clienteNombre);
    } catch {
      Alert.alert('No se pudo exportar', 'Ocurrió un problema al generar el PDF. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const confirmarEliminarReceta = () => {
    Alert.alert('Eliminar receta', `¿Eliminar "${receta?.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarReceta(recetaId);
          router.back();
        },
      },
    ]);
  };

  if (!receta) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Receta',
          headerRight: () => (
            <View style={styles.headerActions}>
              <AnimatedPressable
                onPress={compartirPdf}
                disabled={exportando}
                style={[styles.headerButton, { backgroundColor: exportando ? theme.backgroundSelected : theme.tint }]}>
                <Ionicons name="share-outline" size={19} color={theme.ink} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={confirmarEliminarReceta}
                style={[styles.headerButton, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="trash-outline" size={19} color={theme.danger} />
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
        {clienteNombre && (
          <View style={styles.clienteBadge}>
            <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Receta de {clienteNombre}
            </ThemedText>
          </View>
        )}
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          onBlur={() => nombre.trim() && renombrarReceta(recetaId, nombre.trim())}
          placeholder="Nombre de la receta"
          placeholderTextColor={theme.textSecondary}
          style={[styles.nombreInput, { color: theme.text }]}
        />

        <View style={[styles.totalesCard, Shadows.card as object, { backgroundColor: theme.ink }]}>
          <View style={styles.totalesRow}>
            <AnimatedCounter value={totales.calorias} decimals={0} type="title" themeColor="inkText" style={styles.totalKcal} />
            <ThemedText themeColor="inkTextSecondary" type="small">kcal totales</ThemedText>
          </View>
          <View style={styles.macrosRow}>
            <Macro label="Proteína" value={totales.proteina} color={theme.tint} />
            <Macro label="Carbs" value={totales.carbohidratos} color={theme.accent} />
            <Macro label="Grasa" value={totales.grasa} color={theme.inkTextSecondary} />
          </View>
        </View>

        <ThemedText type="smallBold">Agregar a</ThemedText>
        <View style={styles.comidaChips}>
          {numerosComida.map((n) => {
            const seleccionada = n === comidaSeleccionada;
            return (
              <AnimatedPressable
                key={n}
                onPress={() => setComidaSeleccionada(n)}
                scaleTo={0.94}
                style={[
                  styles.comidaChip,
                  { borderColor: theme.border },
                  seleccionada && { backgroundColor: theme.tint, borderColor: theme.tint },
                ]}>
                <ThemedText type="small" themeColor={seleccionada ? 'ink' : 'textSecondary'}>
                  Comida {n}
                </ThemedText>
              </AnimatedPressable>
            );
          })}
          <AnimatedPressable onPress={agregarComida} scaleTo={0.94} style={[styles.comidaChip, { borderColor: theme.tint }]}>
            <ThemedText type="small" themeColor="tint">
              + Comida
            </ThemedText>
          </AnimatedPressable>
        </View>

        <ThemedText type="smallBold">Buscar alimento</ThemedText>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              // Si ya había un alimento seleccionado sin confirmar, escribir una
              // nueva búsqueda la cancela — si no, la tarjeta de confirmación se
              // queda fija y tapa los resultados de la nueva búsqueda.
              setPendiente(null);
            }}
            placeholder="ej. pechuga de pollo, arroz, manzana…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {buscando && (
          <ThemedText type="small" themeColor="textSecondary">
            Buscando…
          </ThemedText>
        )}

        {!pendiente &&
          resultados.map((r) => (
          <Animated.View key={`${r.fuente}-${r.externalId}`} entering={FadeInDown.springify().damping(14)}>
            <AnimatedPressable
              onPress={() => {
                const peso = pesoPromedioPieza(r.nombre);
                setPendiente(r);
                setUnidadPendiente(peso != null ? 'piezas' : 'gramos');
                setPiezasInput('1');
                setGramos(peso != null ? String(peso) : '100');
                Keyboard.dismiss();
              }}
              style={[styles.resultRow, { borderColor: theme.border }]}>
              <View style={styles.cardInfo}>
                <ThemedText type="small">{r.nombre}</ThemedText>
                <View style={styles.resultMeta}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {Math.round(r.calorias100g)} kcal / 100g
                  </ThemedText>
                  <View style={[styles.fuenteBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.fuenteBadgeText}>
                      {r.fuente === 'fatsecret' ? 'FatSecret' : 'USDA'}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={theme.tint} />
            </AnimatedPressable>
          </Animated.View>
        ))}

        {pendiente && (
          <Animated.View
            entering={FadeIn}
            style={[styles.pendingBox, { backgroundColor: theme.tintSoft, borderColor: theme.tint }]}>
            <ThemedText type="smallBold" themeColor="tint">
              {pendiente.nombre}
            </ThemedText>

            {pesoPiezaPendiente != null && (
              <View style={styles.comidaChips}>
                {(['piezas', 'gramos'] as const).map((u) => (
                  <AnimatedPressable
                    key={u}
                    onPress={() => setUnidadPendiente(u)}
                    scaleTo={0.94}
                    style={[
                      styles.comidaChip,
                      { borderColor: theme.tint },
                      unidadPendiente === u && { backgroundColor: theme.tint },
                    ]}>
                    <ThemedText type="small" themeColor={unidadPendiente === u ? 'ink' : 'tint'}>
                      {u === 'piezas' ? 'Piezas' : 'Gramos'}
                    </ThemedText>
                  </AnimatedPressable>
                ))}
              </View>
            )}

            <View style={styles.pendingRow}>
              {unidadPendiente === 'piezas' && pesoPiezaPendiente != null ? (
                <>
                  <TextInput
                    value={piezasInput}
                    onChangeText={setPiezasInput}
                    keyboardType="decimal-pad"
                    style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    piezas (≈ {Math.round((parseFloat(piezasInput) || 0) * pesoPiezaPendiente)} g)
                  </ThemedText>
                </>
              ) : (
                <>
                  <TextInput
                    value={gramos}
                    onChangeText={setGramos}
                    keyboardType="decimal-pad"
                    style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <ThemedText type="small">gramos</ThemedText>
                </>
              )}
              <AnimatedPressable
                onPress={confirmarAgregar}
                scaleTo={0.9}
                style={[styles.confirmButton, { backgroundColor: theme.tint }]}>
                <Ionicons name="checkmark" size={18} color={theme.ink} />
              </AnimatedPressable>
              <AnimatedPressable onPress={() => setPendiente(null)} scaleTo={0.9} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </AnimatedPressable>
            </View>
          </Animated.View>
        )}

        <AnimatedPressable onPress={() => setManualAbierto((v) => !v)} style={styles.manualToggle}>
          <ThemedText type="small" themeColor="tint">
            {manualAbierto ? '– Cancelar alimento manual' : '+ Agregar alimento manual (no aparece en la búsqueda)'}
          </ThemedText>
        </AnimatedPressable>

        {manualAbierto && (
          <View style={[styles.manualBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <TextInput
              value={manual.nombre}
              onChangeText={(t) => setManual((m) => ({ ...m, nombre: t }))}
              placeholder="Nombre del alimento"
              placeholderTextColor={theme.textSecondary}
              style={[styles.manualInput, { color: theme.text }]}
            />
            <View style={styles.row}>
              <TextInput
                value={manual.calorias}
                onChangeText={(t) => setManual((m) => ({ ...m, calorias: t }))}
                placeholder="kcal/100g"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.manualInput, styles.flex1, { color: theme.text }]}
              />
              <TextInput
                value={manual.proteina}
                onChangeText={(t) => setManual((m) => ({ ...m, proteina: t }))}
                placeholder="Proteína g"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.manualInput, styles.flex1, { color: theme.text }]}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                value={manual.carbohidratos}
                onChangeText={(t) => setManual((m) => ({ ...m, carbohidratos: t }))}
                placeholder="Carbs g"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.manualInput, styles.flex1, { color: theme.text }]}
              />
              <TextInput
                value={manual.grasa}
                onChangeText={(t) => setManual((m) => ({ ...m, grasa: t }))}
                placeholder="Grasa g"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.manualInput, styles.flex1, { color: theme.text }]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Valores por cada 100g. Después de agregarlo puedes tocarlo para editar su índice glucémico.
            </ThemedText>
            <AnimatedPressable
              onPress={agregarManual}
              style={[styles.manualAddButton, { backgroundColor: theme.tint }]}
              scaleTo={0.95}>
              <ThemedText themeColor="ink" type="smallBold">
                Agregar a la receta
              </ThemedText>
            </AnimatedPressable>
          </View>
        )}

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Alimentos ({items.length})
        </ThemedText>
        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no hay alimentos en esta receta.
          </ThemedText>
        ) : (
          gruposComida
            .filter((grupo) => grupo.items.length > 0)
            .map((grupo) => {
              const subtotalKcal = grupo.items.reduce(
                (acc, it) => acc + (it.alimento.calorias100g * it.gramos) / 100,
                0
              );
              return (
                <View key={grupo.comida} style={styles.grupoComida}>
                  <View style={styles.grupoComidaHeader}>
                    <ThemedText type="smallBold" themeColor="tint">
                      Comida {grupo.comida}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {Math.round(subtotalKcal)} kcal
                    </ThemedText>
                  </View>
                  {grupo.items.map((it) => (
                    <View key={it.id}>
                      <Animated.View
                        entering={FadeInDown.springify().damping(14)}
                        style={[styles.itemRow, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
                        <View style={styles.cardInfo}>
                          <ThemedText type="smallBold">{it.alimento.nombre}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {Math.round((it.alimento.calorias100g * it.gramos) / 100)} kcal
                            {(it.alimento.igCrudo != null || it.alimento.igCocido != null) &&
                              ` · IG ${it.alimento.igCrudo ?? '—'}/${it.alimento.igCocido ?? '—'}`}
                          </ThemedText>
                        </View>
                        {it.piezas != null ? (
                          <>
                            <TextInput
                              value={String(it.piezas)}
                              onChangeText={(t) => cambiarPiezas(it, t)}
                              keyboardType="decimal-pad"
                              style={[styles.itemGramos, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
                            />
                            <ThemedText type="small" themeColor="textSecondary">
                              pz
                            </ThemedText>
                          </>
                        ) : (
                          <>
                            <TextInput
                              value={String(it.gramos)}
                              onChangeText={(t) => cambiarGramos(it, t)}
                              keyboardType="decimal-pad"
                              style={[styles.itemGramos, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
                            />
                            <ThemedText type="small" themeColor="textSecondary">
                              g
                            </ThemedText>
                          </>
                        )}
                        <AnimatedPressable onPress={() => editarUnidad(it)} hitSlop={6}>
                          <Ionicons name="swap-horizontal-outline" size={18} color={theme.textSecondary} />
                        </AnimatedPressable>
                        <AnimatedPressable onPress={() => editarIG(it)} hitSlop={6}>
                          <Ionicons name="pulse-outline" size={18} color={theme.accent} />
                        </AnimatedPressable>
                        <AnimatedPressable onPress={() => quitarItem(it)} hitSlop={6}>
                          <Ionicons name="trash-outline" size={18} color={theme.danger} />
                        </AnimatedPressable>
                      </Animated.View>

                      {unidadEditando?.id === it.id && (
                        <Animated.View
                          entering={FadeIn.duration(150)}
                          style={[styles.pendingBox, { backgroundColor: theme.tintSoft, borderColor: theme.tint }]}>
                          <ThemedText type="small" themeColor="tint">
                            Unidad de {it.alimento.nombre}
                          </ThemedText>
                          <View style={styles.comidaChips}>
                            {(['piezas', 'gramos'] as const).map((u) => (
                              <AnimatedPressable
                                key={u}
                                onPress={() => setUnidadEditorTipo(u)}
                                scaleTo={0.94}
                                style={[
                                  styles.comidaChip,
                                  { borderColor: theme.tint },
                                  unidadEditorTipo === u && { backgroundColor: theme.tint },
                                ]}>
                                <ThemedText type="small" themeColor={unidadEditorTipo === u ? 'ink' : 'tint'}>
                                  {u === 'piezas' ? 'Piezas' : 'Gramos'}
                                </ThemedText>
                              </AnimatedPressable>
                            ))}
                          </View>
                          {unidadEditorTipo === 'piezas' && (
                            <View style={styles.pendingRow}>
                              <TextInput
                                value={pesoPiezaInput}
                                onChangeText={setPesoPiezaInput}
                                placeholder="g por pieza"
                                keyboardType="decimal-pad"
                                placeholderTextColor={theme.textSecondary}
                                style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                              />
                              <TextInput
                                value={cantidadPiezaInput}
                                onChangeText={setCantidadPiezaInput}
                                placeholder="piezas"
                                keyboardType="decimal-pad"
                                placeholderTextColor={theme.textSecondary}
                                style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                              />
                            </View>
                          )}
                          <View style={styles.pendingRow}>
                            <AnimatedPressable
                              onPress={guardarUnidad}
                              scaleTo={0.9}
                              style={[styles.confirmButton, { backgroundColor: theme.tint }]}>
                              <Ionicons name="checkmark" size={18} color={theme.ink} />
                            </AnimatedPressable>
                            <AnimatedPressable onPress={() => setUnidadEditando(null)} scaleTo={0.9} hitSlop={8}>
                              <Ionicons name="close" size={22} color={theme.textSecondary} />
                            </AnimatedPressable>
                          </View>
                        </Animated.View>
                      )}

                      {igEditando?.id === it.id && (
                        <Animated.View
                          entering={FadeIn.duration(150)}
                          style={[styles.pendingBox, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                          <ThemedText type="small" themeColor="accent">
                            Índice glucémico de {it.alimento.nombre} (opcional)
                          </ThemedText>
                          <View style={styles.pendingRow}>
                            <TextInput
                              value={igCrudoInput}
                              onChangeText={setIgCrudoInput}
                              placeholder="Crudo"
                              keyboardType="decimal-pad"
                              placeholderTextColor={theme.textSecondary}
                              style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                            />
                            <TextInput
                              value={igCocidoInput}
                              onChangeText={setIgCocidoInput}
                              placeholder="Cocido"
                              keyboardType="decimal-pad"
                              placeholderTextColor={theme.textSecondary}
                              style={[styles.gramosInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                            />
                            <AnimatedPressable
                              onPress={guardarIG}
                              scaleTo={0.9}
                              style={[styles.confirmButton, { backgroundColor: theme.accent }]}>
                              <Ionicons name="checkmark" size={18} color={theme.ink} />
                            </AnimatedPressable>
                            <AnimatedPressable onPress={() => setIgEditando(null)} scaleTo={0.9} hitSlop={8}>
                              <Ionicons name="close" size={22} color={theme.textSecondary} />
                            </AnimatedPressable>
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  ))}
                </View>
              );
            })
        )}

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Observaciones
        </ThemedText>
        <TextInput
          value={observaciones}
          onChangeText={setObservaciones}
          onBlur={() => guardarObservaciones(recetaId, observaciones)}
          placeholder="Recomendaciones adicionales, preparación, etc."
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.observaciones,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        />
      </ScrollView>
      <HideKeyboardButton />
    </ThemedView>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macro}>
      <ThemedText style={{ color, fontSize: 16 }} type="smallBold">
        {Math.round(value)}g
      </ThemedText>
      <ThemedText themeColor="inkTextSecondary" type="small">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerButton: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  nombreInput: { fontSize: 22, fontWeight: '600', paddingVertical: Spacing.one },
  clienteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalesCard: { borderRadius: Radius.large, padding: Spacing.four, gap: Spacing.three, marginVertical: Spacing.two },
  totalesRow: { alignItems: 'center' },
  totalKcal: { fontSize: 44, lineHeight: 48 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macro: { alignItems: 'center', gap: 2 },
  sectionTitle: { marginTop: Spacing.two },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.two, fontSize: 14 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderBottomWidth: 1,
  },
  cardInfo: { flex: 1, gap: 2 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  comidaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  comidaChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Radius.pill, borderWidth: 1 },
  grupoComida: { gap: Spacing.one },
  grupoComidaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.two,
  },
  fuenteBadge: { paddingHorizontal: Spacing.one, paddingVertical: 1, borderRadius: Radius.pill },
  fuenteBadgeText: { fontSize: 10, lineHeight: 14 },
  pendingBox: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.two, gap: Spacing.one },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  gramosInput: { width: 64, borderRadius: Radius.small, padding: Spacing.one, textAlign: 'center' },
  confirmButton: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  manualToggle: { paddingVertical: Spacing.one },
  manualBox: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.two, gap: Spacing.two },
  manualInput: { fontSize: 14, paddingVertical: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex1: { flex: 1 },
  manualAddButton: { borderRadius: Radius.small, padding: Spacing.two, alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: Radius.medium },
  itemGramos: { width: 50, borderRadius: Radius.small, padding: Spacing.one, textAlign: 'center', fontSize: 13 },
  observaciones: {
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.two,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
