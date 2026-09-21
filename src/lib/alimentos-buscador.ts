// ── Buscador unificado de alimentos ─────────────────────────────────────────
// FatSecret es la fuente PRIMARIA (mejor cobertura regional/español); si no
// hay credenciales configuradas, no da resultados, o falla, cae
// automáticamente a USDA + diccionario de traducción (usda.ts) — la app
// nunca se queda sin resultados, con o sin FatSecret configurado.
import { buscarAlimentosFatSecret } from '@/lib/fatsecret';
import { buscarAlimentosUSDA } from '@/lib/usda';

export interface AlimentoBusqueda {
  externalId: number;
  nombre: string;
  calorias100g: number;
  proteina100g: number;
  carbohidratos100g: number;
  grasa100g: number;
  fuente: 'usda' | 'fatsecret';
}

export async function buscarAlimentos(query: string): Promise<AlimentoBusqueda[]> {
  try {
    const resultados = await buscarAlimentosFatSecret(query);
    if (resultados.length > 0) {
      return resultados.map((a) => ({ ...a, fuente: 'fatsecret' as const }));
    }
  } catch {
    // Sin credenciales, sin red, o FatSecret caído — se sigue con USDA abajo.
  }
  const usda = await buscarAlimentosUSDA(query);
  return usda.map((a) => ({
    externalId: a.fdcId,
    nombre: a.nombre,
    calorias100g: a.calorias100g,
    proteina100g: a.proteina100g,
    carbohidratos100g: a.carbohidratos100g,
    grasa100g: a.grasa100g,
    fuente: 'usda' as const,
  }));
}
