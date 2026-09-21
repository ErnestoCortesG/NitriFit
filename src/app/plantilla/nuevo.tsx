import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { PlantillaForm, parsePlantillaForm, plantillaFormValueInicial } from '@/components/plantilla-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { crearPlantilla } from '@/db/database';

export default function NuevaPlantillaScreen() {
  const router = useRouter();
  const [value, setValue] = useState(plantillaFormValueInicial());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const datos = parsePlantillaForm(value);
    if (!datos) {
      setError('Ponle un nombre a la plantilla.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setError(null);
    setGuardando(true);
    await crearPlantilla(datos);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setGuardando(false);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nueva plantilla',
          headerRight: () => (
            <AnimatedPressable onPress={guardar} disabled={guardando} scaleTo={0.92} hitSlop={8}>
              <ThemedText themeColor="tint" type="smallBold">
                Guardar
              </ThemedText>
            </AnimatedPressable>
          ),
        }}
      />
      <PlantillaForm value={value} onChange={setValue} />
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
});
