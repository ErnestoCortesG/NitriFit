import { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native-reanimated';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';

const DURATION = 650;
const easeOut = Easing.out(Easing.cubic);

/** Texto que cuenta de 0 al valor final — usado en las cifras clave (IMC, TMB). */
export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
  ...textProps
}: { value: number; decimals?: number; suffix?: string } & ThemedTextProps) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    start.current = Date.now();
    const from = display;
    const tick = () => {
      const elapsed = Date.now() - start.current;
      const t = Math.min(1, elapsed / DURATION);
      setDisplay(from + (value - from) * easeOut(t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <ThemedText {...textProps}>
      {display.toFixed(decimals)}
      {suffix}
    </ThemedText>
  );
}
