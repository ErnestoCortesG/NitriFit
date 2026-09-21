import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated-pressable';
import { HeaderBand } from '@/components/header-band';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { type Cliente, listarClientes } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { calcularIMC } from '@/lib/calculos';

export default function ClientesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(() => {
    listarClientes()
      .then(setClientes)
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await listarClientes().then(setClientes);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRefrescando(false);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <HeaderBand
        title="Clientes"
        right={
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push('/cliente/nuevo');
            }}
            style={[styles.addButton, Shadows.button as object, { backgroundColor: theme.tint }]}
            scaleTo={0.88}
            hitSlop={8}>
            <Ionicons name="add" size={26} color={theme.ink} />
          </AnimatedPressable>
        }>
        {clientes.length > 0 && (
          <ThemedText themeColor="inkTextSecondary" type="small" style={styles.count}>
            {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </ThemedText>
        )}
      </HeaderBand>

      {!cargando && clientes.length === 0 && (
        <Animated.View entering={FadeIn.duration(320)} style={styles.empty}>
          <View style={[styles.emptyIconWrap, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="people-outline" size={40} color={theme.tint} />
          </View>
          <ThemedText type="smallBold">Sin clientes todavía</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Toca + para registrar al primero: sus datos, medidas y actividad física.
          </ThemedText>
        </Animated.View>
      )}

      <FlatList
        data={clientes}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={theme.tint} />
        }
        renderItem={({ item, index }) => {
          const imc = calcularIMC(item.pesoKg, item.tallaCm);
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * 55).springify().damping(13).mass(0.7)}>
              <AnimatedPressable
                onPress={() => router.push(`/cliente/${item.id}`)}
                style={[styles.card, Shadows.card as object, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.avatar, { backgroundColor: theme.tintSoft }]}>
                  <ThemedText themeColor="tint" style={{ fontFamily: Fonts.sansSemiBold, fontSize: 14 }}>
                    {item.nombre
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')}
                  </ThemedText>
                </View>
                <View style={styles.cardInfo}>
                  <ThemedText type="smallBold">{item.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.edad} años · IMC {imc.valor} · {imc.categoria}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { marginTop: -Spacing.one },
  list: { padding: Spacing.three, paddingTop: Spacing.four, gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
