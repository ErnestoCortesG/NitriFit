import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { PlantillaForm, parsePlantillaForm, plantillaFormValueInicial } from '@/components/plantilla-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { actualizarPlantilla, eliminarPlantilla, obtenerPlantilla } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';

export default function EditarPlantillaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantillaId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const [value, setValue] = useState(plantillaFormValueInicial());
  const [nombreActual, setNombreActual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    obtenerPlantilla(plantillaId).then((p) => {
      if (p) {
        setValue(plantillaFormValueInicial(p));
        setNombreActual(p.nombre);
      }
      setCargado(true);
    });
  }, [plantillaId]);

  const guardar = async () => {
    const datos = parsePlantillaForm(value);
    if (!datos) {
      setError('Ponle un nombre a la plantilla.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setError(null);
    await actualizarPlantilla(plantillaId, datos);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  const confirmarEliminar = () => {
    Alert.alert('Eliminar plantilla', `¿Eliminar "${nombreActual}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await eliminarPlantilla(plantillaId);
          router.back();
        },
      },
    ]);
  };

  if (!cargado) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar plantilla',
          headerRight: () => (
            <AnimatedPressable onPress={guardar} scaleTo={0.92} hitSlop={8}>
              <ThemedText themeColor="tint" type="smallBold">
                Guardar
              </ThemedText>
            </AnimatedPressable>
          ),
        }}
      />
      <PlantillaForm
        value={value}
        onChange={setValue}
        footer={
          <AnimatedPressable
            onPress={confirmarEliminar}
            scaleTo={0.97}
            style={[styles.eliminarButton, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <ThemedText type="smallBold" themeColor="danger">
              Eliminar plantilla
            </ThemedText>
          </AnimatedPressable>
        }
      />
      {error && (
        <ThemedText themeColor="danger" style={styles.error}>
          {error}
        </ThemedText>
      )}
      <HideKeyboardButton />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  eliminarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
});
