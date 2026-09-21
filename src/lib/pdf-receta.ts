import * as Sharing from 'expo-sharing';

import { numeroRecetaParaCliente, type Plantilla, type Receta, type RecetaItem } from '@/db/database';
import {
  INTENSIDAD_OPACIDAD,
  fondoCssBackground,
  fondoInfo,
  fuenteInfo,
  stickerSvgPath,
  tamanoInfo,
} from '@/lib/plantillas';
import {
  PDF_BASE_STYLE,
  PDF_COLORS,
  WATERMARK_STICKER_CSS,
  escapeHtml,
  formatFecha,
  guardarComoPdf,
  pdfFooter,
  renderSticker,
  renderWatermark,
  slugifyFilename,
  statTile,
} from '@/lib/pdf-shared';

interface Totales {
  calorias: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
}

function calcularTotales(items: RecetaItem[]): Totales {
  return items.reduce<Totales>(
    (acc, it) => {
      const f = it.gramos / 100;
      acc.calorias += it.alimento.calorias100g * f;
      acc.proteina += it.alimento.proteina100g * f;
      acc.carbohidratos += it.alimento.carbohidratos100g * f;
      acc.grasa += it.alimento.grasa100g * f;
      return acc;
    },
    { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0 }
  );
}

function agruparPorComida(items: RecetaItem[]): { comida: number; items: RecetaItem[] }[] {
  const numeros = Array.from(new Set(items.map((it) => it.comida))).sort((a, b) => a - b);
  return numeros.map((n) => ({ comida: n, items: items.filter((it) => it.comida === n) }));
}

function renderItemRow(item: RecetaItem): string {
  const cantidad = item.piezas != null ? `${item.piezas} pz` : `${item.gramos} g`;
  const kcal = Math.round((item.alimento.calorias100g * item.gramos) / 100);
  const ig =
    item.alimento.igCrudo != null || item.alimento.igCocido != null
      ? `<span class="ig">IG ${item.alimento.igCrudo ?? '—'}/${item.alimento.igCocido ?? '—'}</span>`
      : '';
  return `
    <tr>
      <td class="nombre">${escapeHtml(item.alimento.nombre)}${ig}</td>
      <td class="cantidad">${escapeHtml(cantidad)}</td>
      <td class="kcal">${kcal} kcal</td>
    </tr>`;
}

function renderGrupo(grupo: { comida: number; items: RecetaItem[] }): string {
  const subtotal = Math.round(
    grupo.items.reduce((sum, it) => sum + (it.alimento.calorias100g * it.gramos) / 100, 0)
  );
  return `
    <section class="grupo">
      <div class="grupo-head">
        <h3>Comida ${grupo.comida}</h3>
        <span>${subtotal} kcal</span>
      </div>
      <table>
        <tbody>${grupo.items.map(renderItemRow).join('')}</tbody>
      </table>
    </section>`;
}

export function generarRecetaHtml(
  receta: Receta,
  items: RecetaItem[],
  clienteNombre: string | null,
  plantilla: Plantilla | null = null
): string {
  const totales = calcularTotales(items);
  const grupos = agruparPorComida(items);
  const fecha = formatFecha(receta.creadoEn);

  const fuente = plantilla ? fuenteInfo(plantilla.fuente) : null;
  const tamano = plantilla ? tamanoInfo(plantilla.tamanoFuente) : null;

  const fontLink = fuente
    ? `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fuente.googleFontsHref}&display=swap" />`
    : '';

  const plantillaStyle = plantilla
    ? `
  ${WATERMARK_STICKER_CSS}
  body { background: ${fondoCssBackground(fondoInfo(plantilla.fondoReceta))}; font-family: ${fuente!.bodyCss}; font-size: ${tamano!.bodyPx}px; }
  h1, .grupo-head h3, .observaciones h3 { font-family: ${fuente!.headingCss}; }
  h1 { font-size: ${tamano!.headingPx}px; }`
    : '';

  const watermarkHtml =
    plantilla?.marcaAguaTexto?.trim() && plantilla
      ? renderWatermark(plantilla.marcaAguaTexto.trim(), INTENSIDAD_OPACIDAD[plantilla.marcaAguaIntensidad])
      : '';
  const stickerHtml = plantilla?.sticker
    ? renderSticker(stickerSvgPath(plantilla.sticker), PDF_COLORS.tint)
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
${fontLink}
<style>
  ${PDF_BASE_STYLE}
  .grupo { margin-bottom: 18px; }
  .grupo-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid ${PDF_COLORS.tint};
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .grupo-head h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
    color: ${PDF_COLORS.tint};
  }
  .grupo-head span { font-size: 11.5px; color: ${PDF_COLORS.textSecondary}; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 0; border-bottom: 1px solid ${PDF_COLORS.border}; font-size: 12.5px; vertical-align: baseline; }
  tr:last-child td { border-bottom: none; }
  td.nombre { width: 55%; }
  td.cantidad { width: 20%; color: ${PDF_COLORS.textSecondary}; }
  td.kcal { width: 25%; text-align: right; color: ${PDF_COLORS.textSecondary}; font-variant-numeric: tabular-nums; }
  .ig { display: inline-block; margin-left: 8px; font-size: 10.5px; color: ${PDF_COLORS.accent}; }
  .observaciones {
    margin-top: 24px;
    padding: 14px 16px;
    border-left: 3px solid ${PDF_COLORS.accent};
    background: ${PDF_COLORS.bgSoft};
    border-radius: 0 8px 8px 0;
  }
  .observaciones h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 13px;
    margin: 0 0 6px;
  }
  .observaciones p { margin: 0; white-space: pre-wrap; font-size: 12.5px; }
  ${plantillaStyle}
</style>
</head>
<body>
  ${watermarkHtml}
  ${stickerHtml}
  <div class="page-content">
  <div class="brand">NutriFit</div>
  <h1>${escapeHtml(receta.nombre)}</h1>
  <div class="meta">${[clienteNombre ? `Para ${escapeHtml(clienteNombre)}` : null, fecha].filter(Boolean).join(' · ')}</div>

  <div class="stats">
    ${statTile('kcal', totales.calorias, PDF_COLORS.tint)}
    ${statTile('Proteína', totales.proteina, PDF_COLORS.ink)}
    ${statTile('Carbos', totales.carbohidratos, PDF_COLORS.accent)}
    ${statTile('Grasa', totales.grasa, PDF_COLORS.textSecondary)}
  </div>

  ${grupos.map(renderGrupo).join('')}

  ${
    receta.observaciones?.trim()
      ? `<div class="observaciones"><h3>Observaciones</h3><p>${escapeHtml(receta.observaciones.trim())}</p></div>`
      : ''
  }

  ${pdfFooter(fecha)}
  </div>
</body>
</html>`;
}

export async function exportarRecetaPdf(
  receta: Receta,
  items: RecetaItem[],
  clienteNombre: string | null,
  plantilla: Plantilla | null = null
): Promise<void> {
  const html = generarRecetaHtml(receta, items, clienteNombre, plantilla);

  // Nombre del archivo: "cliente-receta(N)" si pertenece a un cliente (misma
  // numeración que el resumen del cliente), o el nombre propio de la receta
  // si es una receta suelta sin cliente asignado.
  const nombreArchivo =
    receta.clienteId != null && clienteNombre
      ? `${slugifyFilename(clienteNombre)}-receta(${await numeroRecetaParaCliente(receta.id, receta.clienteId)})`
      : slugifyFilename(receta.nombre);

  const uri = await guardarComoPdf(html, nombreArchivo);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: receta.nombre,
      UTI: 'com.adobe.pdf',
    });
  }
}
