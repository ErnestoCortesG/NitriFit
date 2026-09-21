// ── Traducción español→inglés de términos de alimentos comunes ─────────────
// USDA FoodData Central solo indexa en inglés. No existe un equivalente
// mexicano/en español gratuito con la misma cobertura (ver DESARROLLO.md),
// así que en vez de eso traducimos los términos más comunes antes de buscar.
// No es un traductor general — es un diccionario de comida, a propósito.

const DICCIONARIO: Record<string, string> = {
  // Proteínas / carnes
  pollo: 'chicken', pechuga: 'breast', muslo: 'thigh', pierna: 'leg', ala: 'wing',
  res: 'beef', carne: 'meat', bistec: 'steak', cerdo: 'pork', puerco: 'pork',
  jamon: 'ham', tocino: 'bacon', pavo: 'turkey', pescado: 'fish', atun: 'tuna',
  salmon: 'salmon', camaron: 'shrimp', camarones: 'shrimp', mariscos: 'seafood',
  huevo: 'egg', huevos: 'eggs', clara: 'egg white', yema: 'egg yolk',
  chorizo: 'chorizo', salchicha: 'sausage', tilapia: 'tilapia',
  // Lácteos
  leche: 'milk', queso: 'cheese', yogur: 'yogurt', yogurt: 'yogurt',
  mantequilla: 'butter', crema: 'cream', requeson: 'cottage cheese',
  // Granos / carbohidratos
  arroz: 'rice', pan: 'bread', tortilla: 'tortilla', pasta: 'pasta',
  avena: 'oats', papa: 'potato', patata: 'potato', elote: 'corn', maiz: 'corn',
  frijol: 'beans', frijoles: 'beans', lenteja: 'lentils', lentejas: 'lentils',
  garbanzo: 'chickpeas', garbanzos: 'chickpeas', quinoa: 'quinoa',
  cereal: 'cereal', harina: 'flour', camote: 'sweet potato',
  // Frutas
  manzana: 'apple', platano: 'banana', naranja: 'orange', fresa: 'strawberry',
  fresas: 'strawberries', uva: 'grape', uvas: 'grapes', sandia: 'watermelon',
  melon: 'melon', pina: 'pineapple', mango: 'mango', aguacate: 'avocado',
  limon: 'lime', pera: 'pear', durazno: 'peach', papaya: 'papaya',
  kiwi: 'kiwi', ciruela: 'plum', mandarina: 'tangerine', guayaba: 'guava',
  // Verduras
  lechuga: 'lettuce', jitomate: 'tomato', tomate: 'tomato', cebolla: 'onion',
  zanahoria: 'carrot', brocoli: 'broccoli', espinaca: 'spinach',
  espinacas: 'spinach', pepino: 'cucumber', calabaza: 'squash',
  calabacita: 'zucchini', chile: 'chili pepper', ajo: 'garlic', apio: 'celery',
  coliflor: 'cauliflower', ejote: 'green beans', ejotes: 'green beans',
  pimiento: 'bell pepper', nopal: 'cactus', champinon: 'mushroom',
  champinones: 'mushrooms',
  // Frutos secos / semillas / grasas
  nuez: 'walnut', almendra: 'almond', almendras: 'almonds',
  cacahuate: 'peanut', cacahuates: 'peanuts', semilla: 'seed',
  semillas: 'seeds', aceite: 'oil', chia: 'chia', linaza: 'flaxseed',
  // Azúcares / otros
  azucar: 'sugar', miel: 'honey', sal: 'salt',
  // Preparación (ayuda a acotar resultados crudo/cocido)
  crudo: 'raw', cruda: 'raw', cocido: 'cooked', cocida: 'cooked',
  asado: 'grilled', asada: 'grilled', frito: 'fried', frita: 'fried',
  hervido: 'boiled', hervida: 'boiled',
};

// Palabras que se descartan (no aportan al buscador de USDA).
const DESCARTAR = new Set(['de', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'al', 'un', 'una']);

function sinAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Traduce los términos de comida reconocidos; deja tal cual lo que no reconoce
 * (permite que el usuario también busque directo en inglés o marcas). */
export function traducirConsultaAlimento(query: string): string {
  const palabras = sinAcentos(query.toLowerCase())
    .split(/\s+/)
    .filter((p) => p && !DESCARTAR.has(p));
  return palabras.map((p) => DICCIONARIO[p] ?? p).join(' ');
}

// Inglés→español para traducir NOMBRES de resultado (dirección inversa del
// diccionario de arriba). Varias palabras en español mapean al mismo inglés
// (papa/patata→potato, frijol/frijoles→beans) — se queda con la primera que
// se registró, es solo para mostrar, no para buscar.
const DICCIONARIO_INVERSO: Record<string, string> = {};
for (const [es, en] of Object.entries(DICCIONARIO)) {
  if (!(en in DICCIONARIO_INVERSO)) DICCIONARIO_INVERSO[en] = es;
}

function capitalizarPalabra(w: string): string {
  return w.length ? w[0].toUpperCase() + w.slice(1) : w;
}

/** Traduce palabra por palabra los términos reconocidos dentro de un nombre de
 * alimento (USDA/FatSecret solo tienen nombres en inglés). No es una
 * traducción gramatical (el orden de palabras se queda igual, ej. "chicken
 * breast" → "pollo pechuga" en vez de "pechuga de pollo") — lo que no se
 * reconoce se deja tal cual, normalmente en inglés. */
export function traducirNombreAlimento(nombre: string): string {
  return nombre.replace(/[A-Za-zÀ-ÿ]+/g, (palabra) => {
    const lower = sinAcentos(palabra.toLowerCase());
    // Coincidencia directa primero (cubre pares explícitos como egg/eggs →
    // huevo/huevos, cada uno con su propia traducción en el diccionario).
    const directo = DICCIONARIO_INVERSO[lower];
    if (directo) return capitalizarPalabra(directo);
    // Si no hay entrada para el plural en inglés, se prueba el singular y se
    // le agrega la "s" en español (best-effort, no cubre plurales irregulares).
    if (lower.endsWith('s') && lower.length > 2) {
      const singular = DICCIONARIO_INVERSO[lower.slice(0, -1)];
      if (singular) return capitalizarPalabra(`${singular}s`);
    }
    return palabra;
  });
}

// ── Peso promedio de 1 pieza ────────────────────────────────────────────────
// Para alimentos que naturalmente se cuentan por pieza en vez de pesarse (ej.
// "2 manzanas" en vez de "364 g"). Son aproximaciones de una pieza mediana —
// el usuario puede corregir el peso por alimento desde la receta si no
// aplica a lo que está pesando. Solo sirve para sugerir el modo "piezas" al
// agregar el alimento; el cálculo de calorías siempre usa gramos.
const PESO_PROMEDIO_PIEZA_G: Record<string, number> = {
  manzana: 182, platano: 118, naranja: 154, pera: 178, durazno: 150,
  kiwi: 76, mandarina: 88, guayaba: 90, ciruela: 66,
  huevo: 50, tortilla: 30, aguacate: 200, papa: 170, patata: 170,
  tomate: 123, jitomate: 123, limon: 60,
};

/** Busca una palabra reconocida (singular o plural) dentro del nombre del
 * alimento y devuelve su peso promedio en gramos, o null si no se reconoce
 * ninguna (la mayoría de alimentos se sigue midiendo en gramos). */
export function pesoPromedioPieza(nombre: string): number | null {
  const normalizado = sinAcentos(nombre.toLowerCase());
  for (const [palabra, gramos] of Object.entries(PESO_PROMEDIO_PIEZA_G)) {
    if (new RegExp(`\\b${palabra}s?\\b`).test(normalizado)) return gramos;
  }
  return null;
}
