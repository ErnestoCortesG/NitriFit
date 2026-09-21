// ── Cliente de USDA FoodData Central ────────────────────────────────────────
// API pública y gratuita del gobierno de EE.UU. — da macros y calorías por
// 100g de miles de alimentos genéricos (no productos de marca). NO incluye
// índice glucémico (ningún API público lo da); ese campo se captura a mano
// por alimento una vez que se agrega a una receta.
//
// DEMO_KEY sirve para desarrollar/probar (límite ~30 req/hora por IP). Para
// uso real, genera una key gratis en https://fdc.nal.usda.gov/api-key-signup
// y reemplázala aquí.
import { traducirConsultaAlimento, traducirNombreAlimento } from '@/lib/alimentos-es';

const API_KEY = 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface AlimentoUSDA {
  fdcId: number;
  nombre: string;
  calorias100g: number;
  proteina100g: number;
  carbohidratos100g: number;
  grasa100g: number;
}

// nutrientNumber según USDA: 208=Energía(kcal), 203=Proteína, 204=Grasa, 205=Carbohidratos.
// Se usa el número (no el nombre) porque "Energy" aparece dos veces (kcal y kJ).
function valorNutriente(nutrients: any[], numero: string): number {
  const n = nutrients.find((x) => x.nutrientNumber === numero);
  return n?.value ?? 0;
}

async function buscarCrudo(query: string): Promise<AlimentoUSDA[]> {
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=20&dataType=Foundation,SR%20Legacy&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA respondió ${res.status}`);
  const data = await res.json();
  const foods: any[] = data.foods ?? [];
  return foods
    .map((f) => ({
      fdcId: f.fdcId,
      nombre: capitalizar(traducirNombreAlimento(f.description)),
      calorias100g: valorNutriente(f.foodNutrients, '208'),
      proteina100g: valorNutriente(f.foodNutrients, '203'),
      carbohidratos100g: valorNutriente(f.foodNutrients, '205'),
      grasa100g: valorNutriente(f.foodNutrients, '204'),
    }))
    .filter((f) => f.calorias100g > 0);
}

// USDA solo indexa en inglés — se traduce el término de comida antes de
// buscar (ver alimentos-es.ts). Si la traducción no da resultados (palabra
// no reconocida, marca, etc.) se reintenta con el texto original tal cual.
export async function buscarAlimentosUSDA(query: string): Promise<AlimentoUSDA[]> {
  const traducido = traducirConsultaAlimento(query);
  const resultados = await buscarCrudo(traducido);
  if (resultados.length > 0 || traducido === query.trim().toLowerCase()) return resultados;
  return buscarCrudo(query);
}

function capitalizar(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
