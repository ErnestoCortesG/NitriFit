import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, Keyboard, Platform, StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// iOS reporta el evento ANTES de que suba el teclado (con su duración real);
// Android solo tiene el evento "did" — se usa una duración fija razonable
// ahí, ya que Android no expone la curva de animación nativa del teclado.
const EVT_SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const EVT_HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
const DURACION_ANDROID = 220;

/**
 * Botón flotante que solo aparece mientras el teclado está visible — la
 * "opción de volver a ocultarlo" explícita, sin depender de que el gesto de
 * deslizar se reconozca. Su fundido/escala está sincronizado con la curva y
 * duración reales del teclado (no un fade genérico). La posición vertical se
 * fija directamente (no se anima): mezclar una propiedad de layout como
 * `bottom` con una animación nativa (opacidad/escala) en el mismo nodo
 * revienta el driver nativo de Animated — mejor mantenerlas separadas.
 */
export function HideKeyboardButton() {
  const theme = useTheme();
  const [montado, setMontado] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const progreso = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const onShow = Keyboard.addListener(EVT_SHOW, (e) => {
      setAlturaTeclado((e.endCoordinates?.height ?? 0) + 12);
      setMontado(true);
      RNAnimated.timing(progreso, {
        toValue: 1,
        duration: e.duration || DURACION_ANDROID,
        useNativeDriver: true,
      }).start();
    });
    const onHide = Keyboard.addListener(EVT_HIDE, (e) => {
      RNAnimated.timing(progreso, {
        toValue: 0,
        duration: e.duration || DURACION_ANDROID,
        useNativeDriver: true,
      }).start(() => setMontado(false));
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [progreso]);

  if (!montado) return null;

  return (
    <RNAnimated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: alturaTeclado,
          opacity: progreso,
          transform: [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}>
      <AnimatedPressable
        onPress={() => Keyboard.dismiss()}
        scaleTo={0.9}
        style={[styles.button, Shadows.button as object, { backgroundColor: theme.ink }]}>
        <Ionicons name="chevron-down" size={20} color={theme.tint} />
      </AnimatedPressable>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, alignItems: 'flex-end', zIndex: 20 },
  button: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
});
