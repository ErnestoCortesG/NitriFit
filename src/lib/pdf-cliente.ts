import * as Sharing from 'expo-sharing';

import type { Cliente, Receta } from '@/db/database';
import { ACTIVIDAD_LABEL, calcularGastoEstimado, calcularIMC, calcularTMB } from '@/lib/calculos';
import {
  PDF_BASE_STYLE,
  PDF_COLORS,
  escapeHtml,
  formatFecha,
  guardarComoPdf,
  pdfFooter,
  slugifyFilename,
} from '@/lib/pdf-shared';

function statTileCliente(label: string, value: string, color: string): string {
  return `
    <div class="stat">
      <div class="stat-value" style="color:${color}">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function renderDietaRow(numero: number, totalKcal: number): string {
  return `
    <tr>
      <td class="numero">Dieta ${numero}</td>
      <td class="kcal">${Math.round(totalKcal)} kcal</td>
    </tr>`;
}

export function generarClienteHtml(
  cliente: Cliente,
  recetas: Receta[],
  totalesPorReceta: Record<number, number>
): string {
  const imc = calcularIMC(cliente.pesoKg, cliente.tallaCm);
  const tmb = calcularTMB(cliente.pesoKg, cliente.tallaCm, cliente.edad, cliente.sexo);
  const gasto = calcularGastoEstimado(tmb, cliente.actividadTipo);
  const fecha = formatFecha(new Date().toISOString());

  // Orden ascendente por fecha de creación para que "Dieta 1" sea siempre la
  // primera que se elaboró — el nombre real de la receta no se muestra aquí,
  // solo el número de dieta y su total calórico.
  const recetasOrdenadas = [...recetas].sort(
    (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()
  );

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  ${PDF_BASE_STYLE}
  .info-box {
    border-radius: 10px;
    background: ${PDF_COLORS.bgSoft};
    border-left: 3px solid ${PDF_COLORS.accent};
    padding: 12px 16px;
    margin-bottom: 26px;
    font-size: 12.5px;
  }
  .info-box .gasto { font-weight: 700; color: ${PDF_COLORS.accent}; margin-top: 4px; }
  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 8px;
  }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; border-bottom: 1px solid ${PDF_COLORS.border}; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  td.numero { font-weight: 600; }
  td.kcal { text-align: right; color: ${PDF_COLORS.tint}; font-variant-numeric: tabular-nums; font-weight: 600; }
  .vacio { color: ${PDF_COLORS.textSecondary}; font-size: 12.5px; }
</style>
</head>
<body>
  <div class="brand">NutriFit</div>
  <h1>${escapeHtml(cliente.nombre)}</h1>
  <div class="meta">
    ${cliente.sexo === 'F' ? 'Femenino' : 'Masculino'} · ${cliente.edad} años · ${cliente.pesoKg} kg · ${cliente.tallaCm} cm
    ${cliente.pliegueMm != null ? ` · pliegues ${cliente.pliegueMm} mm` : ''}
  </div>

  <div class="stats">
    ${statTileCliente(`IMC · ${imc.categoria}`, imc.valor.toFixed(1), PDF_COLORS.tint)}
    ${statTileCliente('TMB (kcal/día)', String(tmb), PDF_COLORS.ink)}
    ${gasto != null ? statTileCliente('Gasto estimado (kcal/día)', String(gasto), PDF_COLORS.accent) : ''}
  </div>

  ${
    cliente.actividadTipo
      ? `<div class="info-box">
          ${escapeHtml(ACTIVIDAD_LABEL[cliente.actividadTipo])}${cliente.actividadFrecuencia != null ? ` · ${cliente.actividadFrecuencia} días/sem` : ''}
          ${gasto != null ? `<div class="gasto">Gasto calórico estimado: ${gasto} kcal/día</div>` : ''}
        </div>`
      : ''
  }

  <h2>Dietas</h2>
  ${
    recetasOrdenadas.length === 0
      ? `<p class="vacio">Sin dietas todavía para este cliente.</p>`
      : `<table><tbody>${recetasOrdenadas
          .map((r, i) => renderDietaRow(i + 1, totalesPorReceta[r.id] ?? 0))
          .join('')}</tbody></table>`
  }

  ${pdfFooter(fecha)}
</body>
</html>`;
}

export async function exportarClientePdf(
  cliente: Cliente,
  recetas: Receta[],
  totalesPorReceta: Record<number, number>
): Promise<void> {
  const html = generarClienteHtml(cliente, recetas, totalesPorReceta);
  const uri = await guardarComoPdf(html, slugifyFilename(cliente.nombre));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: cliente.nombre,
      UTI: 'com.adobe.pdf',
    });
  }
}
