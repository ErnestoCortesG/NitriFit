// ── Cliente del proxy de FatSecret para NutriFit ────────────────────────────
// Fuente PRIMARIA de búsqueda de alimentos (ver alimentos-buscador.ts): mejor
// cobertura de alimentos mexicanos/regionales y soporte de búsqueda en
// español que USDA no tiene.
//
// La app YA NO habla directo con FatSecret (OAuth2 + foods.search) — le habla
// a un proxy propio (NutriFit/fatsecret-proxy/, corriendo en una VM de Oracle
// Cloud con IP fija) que hace esa parte por ella. Motivo: FatSecret solo
// permite whitelistear IPs fijas, y cada nutriólogo/entrenador usando la app
// desde su propio teléfono tendría una IP distinta (y cambiante); además el
// CLIENT_SECRET no debe viajar embebido en el APK. Con el proxy, la única IP
// que necesita estar en la whitelist de FatSecret es la de la VM, sin importar
// cuántos teléfonos usen la app. Si el proxy no responde, alimentos-buscador.ts
// cae automáticamente a USDA, así que la app sigue funcionando igual.
import { traducirConsultaAlimento, traducirNombreAlimento } from '@/lib/alimentos-es';

const PROXY_URL = 'http://159.54.147.43:8080';
// Clave compartida simple entre la app y el proxy (ver PROXY_KEY en
// fatsecret-proxy/.env) — no es seguridad fuerte, viaja embebida en la app
// igual que cualquier token de cliente, pero evita que alguien que descubra
// la URL del proxy consuma la cuota de FatSecret sin tener la app.
const PROXY_KEY = '3b96cee5f3c4a49e5e938c2fb450e3a60773347846eaee64ea2ded7437639846';

export interface AlimentoFatSecret {
  externalId: number;
  nombre: string;
  calorias100g: number;
  proteina100g: number;
  carbohidratos100g: number;
  grasa100g: number;
}

// El proxy ya filtra por food_type === 'Generic', convierte la porción base a
// gramos y calcula las macros por 100g (misma lógica que antes vivía aquí,
// ver fatsecret-proxy/server.js) — la app solo traduce consulta/resultado.
//
// region=MX + language=es NO localizan nada en la práctica en el tier
// Basic/gratis de FatSecret (se probó directo contra la API: "manzana" vs
// "apple" — solo encuentra por coincidencia literal en inglés). Por eso se
// traduce la consulta con el mismo diccionario que usa USDA (alimentos-es.ts)
// antes de buscar, y se traduce el nombre del resultado de vuelta a español
// al mostrarlo.
export async function buscarAlimentosFatSecret(query: string): Promise<AlimentoFatSecret[]> {
  const params = new URLSearchParams({ q: traducirConsultaAlimento(query) });
  const res = await fetch(`${PROXY_URL}/foods/search?${params.toString()}`, {
    headers: { 'x-proxy-key': PROXY_KEY },
  });
  if (!res.ok) throw new Error(`Proxy de FatSecret respondió ${res.status}`);
  const data: AlimentoFatSecret[] = await res.json();
  return data.map((alimento) => ({ ...alimento, nombre: traducirNombreAlimento(alimento.nombre) }));
}
