import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { ActividadTipo, NuevoCliente, Sexo } from '@/db/database';
import { useTheme } from '@/hooks/use-theme';
import { ACTIVIDAD_LABEL } from '@/lib/calculos';

const ACTIVIDADES: ActividadTipo[] = ['sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso'];

export interface ClienteFormValue {
  nombre: string;
  sexo: Sexo;
  edad: string;
  pesoKg: string;
  tallaCm: string;
  pliegueMm: string;
  actividadTipo: ActividadTipo | null;
  actividadFrecuencia: string;
}

const VACIO: ClienteFormValue = {
  nombre: '',
  sexo: 'F',
  edad: '',
  pesoKg: '',
  tallaCm: '',
  pliegueMm: '',
  actividadTipo: null,
  actividadFrecuencia: '',
};

export function clienteFormValueInicial(c?: NuevoCliente): ClienteFormValue {
  if (!c) return VACIO;
  return {
    nombre: c.nombre,
    sexo: c.sexo,
    edad: String(c.edad),
    pesoKg: String(c.pesoKg),
    tallaCm: String(c.tallaCm),
    pliegueMm: c.pliegueMm != null ? String(c.pliegueMm) : '',
    actividadTipo: c.actividadTipo,
    actividadFrecuencia: c.actividadFrecuencia != null ? String(c.actividadFrecuencia) : '',
  };
}

/** Valida y convierte el formulario a los tipos que espera la base de datos. null si falta algo obligatorio. */
export function parseClienteForm(v: ClienteFormValue): NuevoCliente | null {
  const nombre = v.nombre.trim();
  const edad = parseInt(v.edad, 10);
  const pesoKg = parseFloat(v.pesoKg);
  const tallaCm = parseFloat(v.tallaCm);
  if (!nombre || isNaN(edad) || isNaN(pesoKg) || isNaN(tallaCm)) return null;
  const pliegueMm = v.pliegueMm.trim() ? parseFloat(v.pliegueMm) : null;
  const actividadFrecuencia = v.actividadFrecuencia.trim() ? parseInt(v.actividadFrecuencia, 10) : null;
  return {
    nombre,
    sexo: v.sexo,
    edad,
    pesoKg,
    tallaCm,
    pliegueMm: pliegueMm != null && !isNaN(pliegueMm) ? pliegueMm : null,
    actividadTipo: v.actividadTipo,
    actividadFrecuencia:
      actividadFrecuencia != null && !isNaN(actividadFrecuencia) ? actividadFrecuencia : null,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

export function ClienteForm({
  value,
  onChange,
}: {
  value: ClienteFormValue;
  onChange: (v: ClienteFormValue) => void;
}) {
  const theme = useTheme();
  const set = <K extends keyof ClienteFormValue>(key: K, val: ClienteFormValue[K]) =>
    onChange({ ...value, [key]: val });

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      onScrollBeginDrag={() => Keyboard.dismiss()}>
      <Field label="Nombre completo">
        <TextInput
          value={value.nombre}
          onChangeText={(t) => set('nombre', t)}
          placeholder="Nombre del cliente"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
      </Field>

      <Field label="Sexo">
        <View style={styles.row}>
          {(['F', 'M'] as Sexo[]).map((s) => (
            <Chip
              key={s}
              label={s === 'F' ? 'Femenino' : 'Masculino'}
              selected={value.sexo === s}
              onPress={() => set('sexo', s)}
            />
          ))}
        </View>
      </Field>

      <View style={styles.row}>
        <Field label="Edad (años)">
          <TextInput
            value={value.edad}
            onChangeText={(t) => set('edad', t)}
            keyboardType="number-pad"
            style={[inputStyle, styles.inputSmall]}
          />
        </Field>
        <Field label="Peso (kg)">
          <TextInput
            value={value.pesoKg}
            onChangeText={(t) => set('pesoKg', t)}
            keyboardType="decimal-pad"
            style={[inputStyle, styles.inputSmall]}
          />
        </Field>
        <Field label="Talla (cm)">
          <TextInput
            value={value.tallaCm}
            onChangeText={(t) => set('tallaCm', t)}
            keyboardType="decimal-pad"
            style={[inputStyle, styles.inputSmall]}
          />
        </Field>
      </View>

      <Field label="Pliegues (mm) — opcional">
        <TextInput
          value={value.pliegueMm}
          onChangeText={(t) => set('pliegueMm', t)}
          keyboardType="decimal-pad"
          placeholder="Suma de pliegues cutáneos"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
      </Field>

      <Field label="Actividad física">
        <View style={styles.wrap}>
          {ACTIVIDADES.map((a) => (
            <Chip
              key={a}
              label={ACTIVIDAD_LABEL[a]}
              selected={value.actividadTipo === a}
              onPress={() => set('actividadTipo', value.actividadTipo === a ? null : a)}
            />
          ))}
        </View>
      </Field>

      <Field label="Frecuencia (días/semana) — opcional">
        <TextInput
          value={value.actividadFrecuencia}
          onChangeText={(t) => set('actividadFrecuencia', t)}
          keyboardType="number-pad"
          placeholder="0–7"
          placeholderTextColor={theme.textSecondary}
          style={[inputStyle, styles.inputSmall]}
        />
      </Field>
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
        {
          backgroundColor: selected ? theme.tint : theme.backgroundElement,
          borderColor: selected ? theme.tint : theme.border,
        },
      ]}>
      <ThemedText type="small" style={selected ? { color: theme.inkText } : undefined}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  field: { gap: Spacing.one, flex: 1 },
  row: { flexDirection: 'row', gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputSmall: { minWidth: 0 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
