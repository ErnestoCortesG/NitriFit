import { Tabs } from 'expo-router/js-tabs';

import { AnimatedTabBar } from '@/components/animated-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <AnimatedTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="recetas" options={{ title: 'Recetas' }} />
      <Tabs.Screen name="rutinas" options={{ title: 'Rutinas' }} />
      <Tabs.Screen name="plantillas" options={{ title: 'Plantillas' }} />
    </Tabs>
  );
}
