import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Fonts } from '@/constants/theme';
import { ThemePreferenceProvider, useThemePreference } from '@/contexts/theme-preference';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  // Se mantiene el splash nativo (preventAutoHideAsync) hasta que las
  // tipografías de marca estén listas — evita el "flash" de la fuente de
  // sistema antes de que cargue Fraunces/Inter.
  if (!fontsLoaded) return null;

  return (
    <ThemePreferenceProvider>
      <RootStack />
    </ThemePreferenceProvider>
  );
}

function RootStack() {
  const { resolved } = useThemePreference();
  const theme = Colors[resolved];

  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.ink },
          headerTintColor: theme.tint,
          headerTitleStyle: { color: theme.inkText, fontFamily: Fonts.sansSemiBold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cliente/nuevo" options={{ title: 'Nuevo cliente', presentation: 'modal' }} />
        <Stack.Screen name="cliente/[id]/index" options={{ title: 'Cliente' }} />
        <Stack.Screen
          name="cliente/[id]/editar"
          options={{ title: 'Editar cliente', presentation: 'modal' }}
        />
        <Stack.Screen name="receta/[id]" options={{ title: 'Receta' }} />
      </Stack>
    </ThemeProvider>
  );
}
