import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ClienteForm, clienteFormValueInicial, parseClienteForm } from '@/components/cliente-form';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { crearCliente } from '@/db/database';

export default function NuevoClienteScreen() {
  const router = useRouter();
  const [value, setValue] = useState(clienteFormValueInicial());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const datos = parseClienteForm(value);
    if (!datos) {
      setError('Revisa nombre, edad, peso y talla — son obligatorios.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setError(null);
    setGuardando(true);
    const id = await crearCliente(datos);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setGuardando(false);
    router.replace(`/cliente/${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nuevo cliente',
          headerRight: () => (
            <AnimatedPressable onPress={guardar} disabled={guardando} scaleTo={0.92} hitSlop={8}>
              <ThemedText themeColor="tint" type="smallBold">
                Guardar
              </ThemedText>
            </AnimatedPressable>
          ),
        }}
      />
      <ClienteForm value={value} onChange={setValue} />
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
