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
