import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable con feedback de escala inmediato (sin rebote/spring — un toque
 * debe sentirse instantáneo, no juguetón). Úsalo en vez de Pressable en
 * cualquier tarjeta, botón o fila accionable de la app.
 */
export const AnimatedPressable = forwardRef<
  React.ElementRef<typeof Pressable>,
  PressableProps & { scaleTo?: number; style?: StyleProp<ViewStyle> }
>(function AnimatedPressable({ scaleTo = 0.97, style, onPressIn, onPressOut, ...rest }, ref) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressableBase
      ref={ref}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 140 });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
});
