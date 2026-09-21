import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';

/** Nombre de archivo legible: espacios → "_", sin caracteres inválidos en el sistema de archivos. */
export function slugifyFilename(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '');
}

/** Genera el PDF y lo copia a un archivo con el nombre deseado — `printToFileAsync` da un nombre aleatorio, así que hay que renombrarlo antes de compartirlo. */
export async function guardarComoPdf(html: string, nombreArchivo: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const origen = new File(uri);
  const destino = new File(Paths.cache, `${nombreArchivo}.pdf`);
  await origen.copy(destino, { overwrite: true });
  return destino.uri;
}

// Paleta fija de los PDFs: no sigue el tema claro/oscuro del teléfono — un
// documento impreso siempre se lee sobre fondo claro. Mismos tonos de marca
// que la app (naranja/verde del ícono sobre grafito/tostado).
export const PDF_COLORS = {
  ink: '#1C1B1A',
  textSecondary: '#746C60',
  tint: '#FF7A29',
  accent: '#1FD672',
  border: '#E4D7BE',
  bgSoft: '#FAF6ED',
} as const;

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Reset + tipografía compartida por todos los documentos exportados. */
export const PDF_BASE_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 44px;
    color: ${PDF_COLORS.ink};
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
  }
  .brand {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${PDF_COLORS.textSecondary};
    margin-bottom: 4px;
  }
  h1 {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 700;
    font-size: 28px;
    margin: 0 0 6px;
  }
  .meta {
    color: ${PDF_COLORS.textSecondary};
    font-size: 12px;
    margin-bottom: 22px;
  }
  .stats {
    display: flex;
    border: 1px solid ${PDF_COLORS.border};
    border-radius: 12px;
    background: ${PDF_COLORS.bgSoft};
    overflow: hidden;
    margin-bottom: 26px;
  }
  .stat {
    flex: 1;
    text-align: center;
    padding: 14px 8px;
    border-right: 1px solid ${PDF_COLORS.border};
  }
  .stat:last-child { border-right: none; }
  .stat-value { font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: 10.5px; color: ${PDF_COLORS.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .footer {
    margin-top: 32px;
    padding-top: 10px;
    border-top: 1px solid ${PDF_COLORS.border};
    font-size: 10px;
    color: ${PDF_COLORS.textSecondary};
    display: flex;
    justify-content: space-between;
  }
`;

export function statTile(label: string, value: number, color: string, suffix = ' g'): string {
  return `
    <div class="stat">
      <div class="stat-value" style="color:${color}">${Math.round(value)}${label === 'kcal' ? '' : suffix}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

export function pdfFooter(fecha: string): string {
  return `
  <div class="footer">
    <span>Generado con NutriFit</span>
    <span>${fecha}</span>
  </div>`;
}

/**
 * Marca de agua: texto repetido en diagonal sobre toda la página. Se genera
 * como una cuadrícula de <text> rotados en un SVG a pantalla completa, en
 * vez de un patrón CSS tileable — más simple de controlar (espaciado,
 * rotación) sin depender de que el tile encaje perfecto.
 */
export function renderWatermark(texto: string, opacidad: number): string {
  const filas = 9;
  const columnas = 4;
  const textos: string[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const x = c * 240 + (f % 2 === 0 ? 30 : 150);
      const y = f * 160 + 70;
      textos.push(`<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})">${escapeHtml(texto)}</text>`);
    }
  }
  return `
  <svg class="watermark" viewBox="0 0 900 1400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <g fill="${PDF_COLORS.ink}" opacity="${opacidad}" font-family="-apple-system, Helvetica, sans-serif" font-size="26" font-weight="700">
      ${textos.join('')}
    </g>
  </svg>`;
}

/** Ícono decorativo fijo en la esquina inferior derecha del documento. */
export function renderSticker(svgInnerPath: string, color: string): string {
  return `
  <div class="sticker">
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      ${svgInnerPath}
    </svg>
  </div>`;
}

export const WATERMARK_STICKER_CSS = `
  .watermark { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
  .sticker { position: fixed; bottom: 26px; right: 30px; z-index: 1; opacity: 0.9; }
  .page-content { position: relative; z-index: 1; }
`;
