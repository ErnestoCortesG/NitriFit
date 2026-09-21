import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ClienteForm, clienteFormValueInicial, parseClienteForm } from '@/components/cliente-form';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { actualizarCliente, obtenerCliente } from '@/db/database';

export default function EditarClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const router = useRouter();
  const [value, setValue] = useState(clienteFormValueInicial());
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    obtenerCliente(clienteId).then((c) => {
      if (c) setValue(clienteFormValueInicial(c));
      setCargado(true);
    });
  }, [clienteId]);

  const guardar = async () => {
    const datos = parseClienteForm(value);
    if (!datos) {
      setError('Revisa nombre, edad, peso y talla — son obligatorios.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setError(null);
    await actualizarCliente(clienteId, datos);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  if (!cargado) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar cliente',
          headerRight: () => (
            <AnimatedPressable onPress={guardar} scaleTo={0.92} hitSlop={8}>
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
