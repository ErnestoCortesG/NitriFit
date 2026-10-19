# NutriFit

App Android para entrenadores personales y nutriólogos: crea recetas y rutinas de entrenamiento, exporta como PDF y comparte por WhatsApp/correo. Incluye catálogo de clientes con cálculos corporales (IMC, TMB) y plantillas de diseño personalizables.

---

## Estado actual · 19 oct 2026

| | |
|---|---|
| **Stack** | Expo SDK 57 · React Native · TypeScript · expo-router · expo-sqlite |
| **Target** | Android APK (EAS Build) |
| **Repo** | Local únicamente — **sin remote en GitHub** |
| **Último commit** | `3e18281` · Fix FatSecret search falling back to USDA in built APK |
| **Build EAS** | `@netoexpo/nutrifit-app` (id `dfaac965-4d32-4c8b-9506-6b78ebdb6a01`) |

### Módulos completados

| Módulo | Estado |
|---|---|
| **Clientes** | ✅ Completo — catálogo, datos corporales, IMC/TMB |
| **Recetas** | ✅ Completo — búsqueda FatSecret/USDA, composición nutricional |
| **Plantillas** | ✅ Completo — fondo de color / ilustración, tipografías Google Fonts, escala, marca de agua, sticker |
| **PDF Export** | ✅ Completo — por receta y por cliente; selector de plantilla; compartir WhatsApp/email |
| **Rutinas** | 🚧 Pendiente — placeholder "Próximamente"; sin modelo de datos ni pantallas |

### Palette y diseño

- Superficie: grafito cálido `#1C1B1A` + tostado (dark-only)
- Tint (naranja): `#FF7A29` · Accent (verde): `#1FD672` — tomados del ícono de la app
- Tipografía: Fraunces (headings) + Inter (body)
- Ícono y splash actualizados; monograma NF en dos tonos

### Búsqueda de alimentos

Dual-source: FatSecret primero (vía proxy VM en `159.54.147.43:8000`) → fallback automático USDA + diccionario de traducción. El proxy mantiene las credenciales FatSecret; la app nunca las tiene directamente.

**Gotcha en APK real:** el dominio del proxy es HTTP (HTTPS pendiente); el APK requiere `android:usesCleartextTraffic="true"` en el AndroidManifest para que FatSecret funcione en builds de producción.

---

## Inicio rápido (desarrollo)

```bash
cd nutrifit-app
npx expo start
```

Escanea el QR con la app **Expo Go** en el teléfono (Android o iOS). Expo Go requiere sesión iniciada en la app del teléfono para conectarse.

### Gotchas conocidos

- `npx expo install <pkg>` falla en esta máquina (`EALLOWSCRIPTS`). Alternativa: agregar el paquete a `package.json` manualmente y correr `npm install`.
- Para validar el bundle de Android: `?platform=android` con header `Expo-Platform: android`.

---

## Build APK (producción)

```bash
npx eas-cli build --profile preview --platform android --non-interactive
```

- La cola de EAS (tier gratuito) puede tomar 30–45+ min antes de compilar.
- Monitorear con `npx eas-cli build:view <build-id>`.

---

## Pendientes

- Módulo **Rutinas**: definir modelo de datos y construir pantallas
- **HTTPS** en el proxy FatSecret (Oracle Linux VM `159.54.147.43`)
- Crear **remote en GitHub** para el repo (actualmente solo local)
- Verificar fix de cleartext-traffic en nueva build APK (`3e18281`)
