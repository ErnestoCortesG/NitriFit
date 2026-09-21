import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ClienteForm, clienteFormValueInicial, parseClienteForm } from '@/components/cliente-form';
import { HideKeyboardButton } from '@/components/hide-keyboard-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { actualizarCliente, eliminarCliente, obtenerCliente } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';

export default function EditarClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const [value, setValue] = useState(clienteFormValueInicial());
  const [nombreActual, setNombreActual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    obtenerCliente(clienteId).then((c) => {
      if (c) {
        setValue(clienteFormValueInicial(c));
        setNombreActual(c.nombre);
      }
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

  const confirmarEliminar = () => {
    Alert.alert('Eliminar cliente', `¿Eliminar a ${nombreActual}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await eliminarCliente(clienteId);
          router.replace('/');
        },
      },
    ]);
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
      <ClienteForm
        value={value}
        onChange={setValue}
        footer={
          <AnimatedPressable
            onPress={confirmarEliminar}
            scaleTo={0.97}
            style={[styles.eliminarButton, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <ThemedText type="smallBold" themeColor="danger">
              Eliminar cliente
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
