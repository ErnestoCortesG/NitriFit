import type { FuentePlantilla, IntensidadMarcaAgua, TamanoFuentePlantilla } from '@/db/database';

export interface FuenteInfo {
  key: FuentePlantilla;
  label: string;
  // Para la vista previa dentro de la app (RN) — nombres tal como se cargaron en useFonts.
  headingFontFamily: string;
  bodyFontFamily: string;
  // Para el PDF: Google Fonts se carga por <link>, con acceso a internet real
  // (a diferencia del Artifact tool, expo-print renderiza en un WebView nativo sin CSP).
  googleFontsHref: string;
  headingCss: string;
  bodyCss: string;
}

export const FUENTES: FuenteInfo[] = [
  {
    key: 'editorial',
    label: 'Editorial',
    headingFontFamily: 'Fraunces_700Bold',
    bodyFontFamily: 'Inter_400Regular',
    googleFontsHref: 'family=Fraunces:wght@700&family=Inter:wght@400;600',
    headingCss: "'Fraunces', Georgia, serif",
    bodyCss: "'Inter', -apple-system, Helvetica, sans-serif",
  },
  {
    key: 'moderno',
    label: 'Moderno',
    headingFontFamily: 'Poppins_700Bold',
    bodyFontFamily: 'Inter_400Regular',
    googleFontsHref: 'family=Poppins:wght@700&family=Inter:wght@400;600',
    headingCss: "'Poppins', -apple-system, sans-serif",
    bodyCss: "'Inter', -apple-system, Helvetica, sans-serif",
  },
  {
    key: 'clasico',
    label: 'Clásico',
    headingFontFamily: 'PlayfairDisplay_700Bold',
    bodyFontFamily: 'Lato_400Regular',
    googleFontsHref: 'family=Playfair+Display:wght@700&family=Lato:wght@400;700',
    headingCss: "'Playfair Display', Georgia, serif",
    bodyCss: "'Lato', -apple-system, Helvetica, sans-serif",
  },
];

export function fuenteInfo(key: FuentePlantilla): FuenteInfo {
  return FUENTES.find((f) => f.key === key) ?? FUENTES[0];
}

export interface TamanoInfo {
  key: TamanoFuentePlantilla;
  label: string;
  bodyPx: number;
  headingPx: number;
}

export const TAMANOS: TamanoInfo[] = [
  { key: 'chico', label: 'Chico', bodyPx: 12, headingPx: 24 },
  { key: 'mediano', label: 'Mediano', bodyPx: 13, headingPx: 28 },
  { key: 'grande', label: 'Grande', bodyPx: 14.5, headingPx: 32 },
];

export function tamanoInfo(key: TamanoFuentePlantilla): TamanoInfo {
  return TAMANOS.find((t) => t.key === key) ?? TAMANOS[1];
}

export const INTENSIDAD_OPACIDAD: Record<IntensidadMarcaAgua, number> = {
  sutil: 0.06,
  visible: 0.14,
};

export interface FondoInfo {
  key: string;
  label: string;
  tipo: 'color' | 'imagen';
  // tipo 'color': el fondo es este color plano.
  hex?: string;
  // tipo 'imagen': color base + patrón ilustrado por encima (íconos para la
  // vista previa en RN, mismo tema dibujado como SVG repetido en el PDF).
  baseHex?: string;
  iconos?: string[];
  patronColor?: string;
}

// Solo fondos claros: el resto del documento (texto, tablas) está pensado
// para tinta oscura sobre claro — un fondo oscuro seleccionable necesitaría
// invertir toda esa paleta, fuera de alcance de esta primera versión.
export const FONDOS: FondoInfo[] = [
  { key: 'blanco', label: 'Blanco', tipo: 'color', hex: '#FFFFFF' },
  { key: 'tostado', label: 'Tostado', tipo: 'color', hex: '#F3E6CC' },
  { key: 'verde_suave', label: 'Verde suave', tipo: 'color', hex: '#DBF7E7' },
  { key: 'naranja_suave', label: 'Naranja suave', tipo: 'color', hex: '#FFE4CE' },
  {
    key: 'nutricion',
    label: 'Nutrición',
    tipo: 'imagen',
    baseHex: '#EAF7EC',
    iconos: ['nutrition', 'leaf', 'restaurant'],
    patronColor: '#1FD672',
  },
  {
    key: 'ejercicio',
    label: 'Ejercicio',
    tipo: 'imagen',
    baseHex: '#FFF1E6',
    iconos: ['barbell', 'fitness', 'walk'],
    patronColor: '#FF7A29',
  },
];

export function fondoInfo(key: string): FondoInfo {
  return FONDOS.find((f) => f.key === key) ?? FONDOS[0];
}

/** Color plano usable donde no cabe un patrón (ej. un swatch chico en una lista). */
export function fondoColorPlano(fondo: FondoInfo): string {
  return fondo.hex ?? fondo.baseHex ?? '#FFFFFF';
}

/**
 * Patrón ilustrado como SVG tileable, para el `background-image` del PDF —
 * dos trazos simples (mismo lenguaje visual que los stickers) repetidos en
 * diagonal sobre un tile de 130×130.
 */
export function fondoPatternDataUri(fondo: FondoInfo): string | null {
  if (fondo.tipo !== 'imagen' || !fondo.patronColor) return null;
  const color = encodeURIComponent(fondo.patronColor);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='130' height='130'>` +
    `<g fill='none' stroke='${color}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.45'>` +
    `<g transform='translate(10 14) scale(0.9)'>${fondo.key === 'nutricion' ? PATRON_HOJA : PATRON_PESA}</g>` +
    `<g transform='translate(70 70) scale(0.7) rotate(18)'>${fondo.key === 'nutricion' ? PATRON_HOJA : PATRON_PESA}</g>` +
    `</g></svg>`;
  return `data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}`;
}

const PATRON_HOJA = '<path d="M4 20C4 10 12 4 20 4C20 12 14 20 4 20Z"/><path d="M4 20C8 16 12 12 20 4"/>';
const PATRON_PESA =
  '<circle cx="4.5" cy="12" r="2.5"/><circle cx="19.5" cy="12" r="2.5"/><path d="M7 12H17"/>';

/** Valor CSS `background` completo para el PDF: color plano, o color base + patrón repetido. */
export function fondoCssBackground(fondo: FondoInfo): string {
  const patron = fondoPatternDataUri(fondo);
  if (!patron) return fondoColorPlano(fondo);
  return `${fondoColorPlano(fondo)} url("${patron}") repeat`;
}

export interface StickerInfo {
  key: string;
  label: string;
  // Ícono para la vista previa en RN.
  ionicon: string;
}

export const STICKERS: StickerInfo[] = [
  { key: 'hoja', label: 'Hoja', ionicon: 'leaf' },
  { key: 'pesa', label: 'Pesa', ionicon: 'barbell' },
  { key: 'corazon', label: 'Corazón', ionicon: 'heart' },
  { key: 'estrella', label: 'Estrella', ionicon: 'star' },
  { key: 'check', label: 'Check', ionicon: 'checkmark-circle' },
  { key: 'listón', label: 'Listón', ionicon: 'ribbon' },
];

/** SVG de cada sticker para el PDF — trazos simples, no dependen de ningún ícono-font externo. */
export function stickerSvgPath(key: string): string {
  switch (key) {
    case 'hoja':
      return '<path d="M4 20C4 10 12 4 20 4C20 12 14 20 4 20Z"/><path d="M4 20C8 16 12 12 20 4"/>';
    case 'pesa':
      return '<circle cx="4.5" cy="12" r="2.5"/><circle cx="19.5" cy="12" r="2.5"/><path d="M7 12H17" stroke-width="3"/>';
    case 'corazon':
      return '<path d="M12 20C12 20 3 14.5 3 8.5C3 5.5 5.5 3.5 8 3.5C10 3.5 11.5 4.7 12 6C12.5 4.7 14 3.5 16 3.5C18.5 3.5 21 5.5 21 8.5C21 14.5 12 20 12 20Z"/>';
    case 'estrella':
      return '<path d="M12 2.5L14.8 9.2L22 9.9L16.6 14.7L18.2 21.8L12 18L5.8 21.8L7.4 14.7L2 9.9L9.2 9.2Z"/>';
    case 'check':
      return '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5L10.5 15.5L16.5 8.5"/>';
    case 'listón':
      return '<circle cx="12" cy="8" r="5.5"/><path d="M8.5 12.5L6 21L12 18L18 21L15.5 12.5"/>';
    default:
      return '';
  }
}
