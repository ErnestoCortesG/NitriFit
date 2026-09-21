import type { ActividadTipo, Sexo } from '@/db/database';

export interface ResultadoIMC {
  valor: number;
  categoria: 'Bajo peso' | 'Normal' | 'Sobrepeso' | 'Obesidad';
}

/** IMC = peso(kg) / talla(m)^2 */
export function calcularIMC(pesoKg: number, tallaCm: number): ResultadoIMC {
  const tallaM = tallaCm / 100;
  const valor = Math.round((pesoKg / (tallaM * tallaM)) * 10) / 10;
  const categoria =
    valor < 18.5 ? 'Bajo peso' : valor < 25 ? 'Normal' : valor < 30 ? 'Sobrepeso' : 'Obesidad';
  return { valor, categoria };
}

/** Tasa Metabólica Basal (Mifflin-St Jeor) — calorías/día en reposo. */
export function calcularTMB(pesoKg: number, tallaCm: number, edad: number, sexo: Sexo): number {
  const base = 10 * pesoKg + 6.25 * tallaCm - 5 * edad;
  return Math.round(sexo === 'M' ? base + 5 : base - 161);
}

export const ACTIVIDAD_FACTOR: Record<ActividadTipo, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muy_intenso: 1.9,
};

export const ACTIVIDAD_LABEL: Record<ActividadTipo, string> = {
  sedentario: 'Sedentario (poco o nulo ejercicio)',
  ligero: 'Ligero (1–3 días/sem)',
  moderado: 'Moderado (3–5 días/sem)',
  intenso: 'Intenso (6–7 días/sem)',
  muy_intenso: 'Muy intenso (2x/día o físico)',
};

/** Gasto calórico total estimado (TMB × factor de actividad). */
export function calcularGastoEstimado(tmb: number, actividad: ActividadTipo | null): number | null {
  if (!actividad) return null;
  return Math.round(tmb * ACTIVIDAD_FACTOR[actividad]);
}
