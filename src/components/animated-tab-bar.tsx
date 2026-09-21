import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, IconName> = {
  index: 'people',
  recetas: 'restaurant',
  rutinas: 'barbell',
  plantillas: 'color-palette',
};

function TabButton({
  routeName,
  label,
  focused,
  onPress,
}: {
  routeName: string;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  // "Settle" spring real: al activarse, el ícono SALTA a 1.22 y luego
  // rebota hasta asentarse en 1 (no una simple interpolación) — así se
  // siente un golpe de vida en cada cambio de tab, no solo un fundido.
  const scale = useSharedValue(focused ? 1 : 0.92);
  useEffect(() => {
    if (focused) {
      scale.value = 1.22;
      scale.value = withSpring(1, { damping: 6.5, stiffness: 260, mass: 0.6 });
    } else {
      scale.value = withTiming(0.92, { duration: 140 });
    }
  }, [focused, scale]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.4, { damping: 12, stiffness: 260 }) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}>
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Ionicons
          name={TAB_ICONS[routeName] ?? 'ellipse'}
          size={22}
          color={focused ? theme.tint : theme.inkTextSecondary}
        />
      </Animated.View>
      <ThemedText
        style={[styles.label, { color: focused ? theme.tint : theme.inkTextSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </ThemedText>
      <Animated.View style={[styles.dot, { backgroundColor: theme.accent }, dotStyle]} />
    </Pressable>
  );
}

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();

  useEffect(() => {
    Haptics.selectionAsync().catch(() => {});
  }, [state.index]);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.ink }]}>
      <SafeAreaView edges={['bottom']} style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TabButton key={route.key} routeName={route.name} label={label} focused={focused} onPress={onPress} />
          );
        })}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 0 },
  row: { flexDirection: 'row', paddingTop: Spacing.two },
  tabButton: { flex: 1, alignItems: 'center', gap: 2, paddingBottom: Spacing.one },
  iconWrap: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
