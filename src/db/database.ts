import * as SQLite from 'expo-sqlite';

import { pesoPromedioPieza } from '@/lib/alimentos-es';

export type Sexo = 'M' | 'F';

export type ActividadTipo =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'intenso'
  | 'muy_intenso';

export interface Cliente {
  id: number;
  nombre: string;
  sexo: Sexo;
  edad: number;
  pesoKg: number;
  tallaCm: number;
  pliegueMm: number | null;
  actividadTipo: ActividadTipo | null;
  actividadFrecuencia: number | null;
  creadoEn: string;
}

export type NuevoCliente = Omit<Cliente, 'id' | 'creadoEn'>;

export type HistorialTipo = 'nota' | 'receta' | 'rutina';

export interface HistorialEntry {
  id: number;
  clienteId: number;
  fecha: string;
  tipo: HistorialTipo;
  contenido: string;
}

export type FuenteAlimento = 'usda' | 'fatsecret' | 'manual';

export interface Alimento {
  id: number;
  fdcId: number | null;
  nombre: string;
  calorias100g: number;
  proteina100g: number;
  carbohidratos100g: number;
  grasa100g: number;
  igCrudo: number | null;
  igCocido: number | null;
  // Peso aproximado (g) de 1 pieza/unidad, para alimentos que se miden por
  // pieza en vez de por gramos (ej. manzanas, plátanos). Null = solo gramos.
  gramosPorPieza: number | null;
  fuente: FuenteAlimento;
}

export type NuevoAlimento = Omit<Alimento, 'id'>;

export interface Receta {
  id: number;
  nombre: string;
  observaciones: string | null;
  creadoEn: string;
  // Si no es null, esta receta pertenece a un cliente específico — no
  // aparece en el módulo general de Recetas, solo dentro de ese cliente.
  clienteId: number | null;
}

export interface RecetaItem {
  id: number;
  recetaId: number;
  alimentoId: number;
  gramos: number;
  orden: number;
  comida: number;
  // Si no es null, este item se mide en piezas (gramos ya viene calculado
  // como piezas × alimento.gramosPorPieza y sigue siendo lo que usa el
  // cálculo de calorías/macros).
  piezas: number | null;
  // Datos del alimento, ya unidos (join) para no hacer una consulta por fila.
  alimento: Alimento;
}

const DB_NAME = 'nutrifit.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          sexo TEXT NOT NULL,
          edad INTEGER NOT NULL,
          peso_kg REAL NOT NULL,
          talla_cm REAL NOT NULL,
          pliegue_mm REAL,
          actividad_tipo TEXT,
          actividad_frecuencia INTEGER,
          creado_en TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS historial (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
          fecha TEXT NOT NULL,
          tipo TEXT NOT NULL,
          contenido TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS alimentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fdc_id INTEGER UNIQUE,
          nombre TEXT NOT NULL,
          calorias_100g REAL NOT NULL,
          proteina_100g REAL NOT NULL,
          carbohidratos_100g REAL NOT NULL,
          grasa_100g REAL NOT NULL,
          ig_crudo REAL,
          ig_cocido REAL,
          gramos_por_pieza REAL,
          fuente TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recetas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          observaciones TEXT,
          creado_en TEXT NOT NULL,
          cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS receta_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
          alimento_id INTEGER NOT NULL REFERENCES alimentos(id),
          gramos REAL NOT NULL,
          orden INTEGER NOT NULL,
          comida INTEGER NOT NULL DEFAULT 1,
          piezas REAL
        );
        CREATE TABLE IF NOT EXISTS preferencias (
          clave TEXT PRIMARY KEY,
          valor TEXT NOT NULL
        );
      `);
      // Migraciones para bases ya creadas antes de estas columnas: SQLite no
      // soporta "ADD COLUMN IF NOT EXISTS", así que se intentan y se ignora
      // el error de cada una si ya existe.
      await db.execAsync('ALTER TABLE receta_items ADD COLUMN comida INTEGER NOT NULL DEFAULT 1').catch(() => {});
      await db.execAsync('ALTER TABLE receta_items ADD COLUMN piezas REAL').catch(() => {});
      await db.execAsync('ALTER TABLE alimentos ADD COLUMN gramos_por_pieza REAL').catch(() => {});
      await db.execAsync('ALTER TABLE recetas ADD COLUMN cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE').catch(() => {});
      return db;
    });
  }
  return dbPromise;
}

function rowToCliente(row: any): Cliente {
  return {
    id: row.id,
    nombre: row.nombre,
    sexo: row.sexo,
    edad: row.edad,
    pesoKg: row.peso_kg,
    tallaCm: row.talla_cm,
    pliegueMm: row.pliegue_mm,
    actividadTipo: row.actividad_tipo,
    actividadFrecuencia: row.actividad_frecuencia,
    creadoEn: row.creado_en,
  };
}

export async function listarClientes(): Promise<Cliente[]> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE ASC');
  return rows.map(rowToCliente);
}

export async function obtenerCliente(id: number): Promise<Cliente | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM clientes WHERE id = ?', id);
  return row ? rowToCliente(row) : null;
}

export async function crearCliente(c: NuevoCliente): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO clientes (nombre, sexo, edad, peso_kg, talla_cm, pliegue_mm, actividad_tipo, actividad_frecuencia, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    c.nombre,
    c.sexo,
    c.edad,
    c.pesoKg,
    c.tallaCm,
    c.pliegueMm,
    c.actividadTipo,
    c.actividadFrecuencia,
    new Date().toISOString()
  );
  return res.lastInsertRowId;
}

export async function actualizarCliente(id: number, c: NuevoCliente): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE clientes SET nombre = ?, sexo = ?, edad = ?, peso_kg = ?, talla_cm = ?, pliegue_mm = ?, actividad_tipo = ?, actividad_frecuencia = ?
     WHERE id = ?`,
    c.nombre,
    c.sexo,
    c.edad,
    c.pesoKg,
    c.tallaCm,
    c.pliegueMm,
    c.actividadTipo,
    c.actividadFrecuencia,
    id
  );
}

export async function eliminarCliente(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM clientes WHERE id = ?', id);
}

export async function listarHistorial(clienteId: number): Promise<HistorialEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM historial WHERE cliente_id = ? ORDER BY fecha DESC',
    clienteId
  );
  return rows.map((r: any) => ({
    id: r.id,
    clienteId: r.cliente_id,
    fecha: r.fecha,
    tipo: r.tipo,
    contenido: r.contenido,
  }));
}

export async function agregarHistorial(
  clienteId: number,
  tipo: HistorialTipo,
  contenido: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO historial (cliente_id, fecha, tipo, contenido) VALUES (?, ?, ?, ?)',
    clienteId,
    new Date().toISOString(),
    tipo,
    contenido
  );
}

// ── Alimentos (caché local de USDA + alimentos manuales) ───────────────────
function rowToAlimento(row: any): Alimento {
  return {
    id: row.id,
    fdcId: row.fdc_id,
    nombre: row.nombre,
    calorias100g: row.calorias_100g,
    proteina100g: row.proteina_100g,
    carbohidratos100g: row.carbohidratos_100g,
    grasa100g: row.grasa_100g,
    igCrudo: row.ig_crudo,
    igCocido: row.ig_cocido,
    gramosPorPieza: row.gramos_por_pieza,
    fuente: row.fuente,
  };
}

export async function buscarAlimentosLocal(query: string): Promise<Alimento[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM alimentos WHERE nombre LIKE ? ORDER BY nombre COLLATE NOCASE ASC LIMIT 20',
    `%${query}%`
  );
  return rows.map(rowToAlimento);
}

/**
 * Inserta un alimento venido de USDA o FatSecret, o devuelve el ya cacheado
 * si ese id externo ya existe. La columna `fdc_id` es UNIQUE a nivel de toda
 * la tabla (no por fuente) — como los id de FatSecret y USDA son espacios de
 * numeración independientes que podrían coincidir, los de FatSecret se
 * guardan en negativo para garantizar que nunca choquen sin migrar el esquema.
 */
export async function cachearAlimentoExterno(
  fuente: 'usda' | 'fatsecret',
  a: {
    externalId: number;
    nombre: string;
    calorias100g: number;
    proteina100g: number;
    carbohidratos100g: number;
    grasa100g: number;
  }
): Promise<Alimento> {
  const db = await getDb();
  const idAlmacenado = fuente === 'fatsecret' ? -a.externalId : a.externalId;
  const existente = await db.getFirstAsync('SELECT * FROM alimentos WHERE fdc_id = ?', idAlmacenado);
  if (existente) return rowToAlimento(existente);
  const gramosPorPieza = pesoPromedioPieza(a.nombre);
  const res = await db.runAsync(
    `INSERT INTO alimentos (fdc_id, nombre, calorias_100g, proteina_100g, carbohidratos_100g, grasa_100g, gramos_por_pieza, fuente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    idAlmacenado,
    a.nombre,
    a.calorias100g,
    a.proteina100g,
    a.carbohidratos100g,
    a.grasa100g,
    gramosPorPieza,
    fuente
  );
  return {
    id: res.lastInsertRowId,
    fdcId: idAlmacenado,
    nombre: a.nombre,
    calorias100g: a.calorias100g,
    proteina100g: a.proteina100g,
    carbohidratos100g: a.carbohidratos100g,
    grasa100g: a.grasa100g,
    igCrudo: null,
    igCocido: null,
    gramosPorPieza,
    fuente,
  };
}

export async function crearAlimentoManual(
  a: Omit<NuevoAlimento, 'fdcId' | 'fuente' | 'gramosPorPieza'>
): Promise<Alimento> {
  const db = await getDb();
  const gramosPorPieza = pesoPromedioPieza(a.nombre);
  const res = await db.runAsync(
    `INSERT INTO alimentos (fdc_id, nombre, calorias_100g, proteina_100g, carbohidratos_100g, grasa_100g, ig_crudo, ig_cocido, gramos_por_pieza, fuente)
     VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
    a.nombre,
    a.calorias100g,
    a.proteina100g,
    a.carbohidratos100g,
    a.grasa100g,
    a.igCrudo,
    a.igCocido,
    gramosPorPieza
  );
  return { id: res.lastInsertRowId, fdcId: null, fuente: 'manual', gramosPorPieza, ...a };
}

export async function actualizarPesoPorPieza(alimentoId: number, gramosPorPieza: number | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE alimentos SET gramos_por_pieza = ? WHERE id = ?', gramosPorPieza, alimentoId);
}

export async function actualizarIndiceGlucemico(
  alimentoId: number,
  igCrudo: number | null,
  igCocido: number | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE alimentos SET ig_crudo = ?, ig_cocido = ? WHERE id = ?', igCrudo, igCocido, alimentoId);
}

// ── Recetas ─────────────────────────────────────────────────────────────────
function rowToReceta(r: any): Receta {
  return {
    id: r.id,
    nombre: r.nombre,
    observaciones: r.observaciones,
    creadoEn: r.creado_en,
    clienteId: r.cliente_id,
  };
}

// Solo recetas "sueltas" (sin cliente) — las de un cliente viven únicamente
// en su perfil, ver listarRecetasCliente.
export async function listarRecetas(): Promise<Receta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM recetas WHERE cliente_id IS NULL ORDER BY creado_en DESC');
  return rows.map(rowToReceta);
}

export async function listarRecetasCliente(clienteId: number): Promise<Receta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM recetas WHERE cliente_id = ? ORDER BY creado_en DESC',
    clienteId
  );
  return rows.map(rowToReceta);
}

/** Total de kcal por receta de un cliente, en una sola consulta agregada — para el resumen del PDF del cliente, que no necesita el detalle de cada comida. */
export async function totalCaloriasPorReceta(clienteId: number): Promise<Record<number, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ receta_id: number; total: number | null }>(
    `SELECT r.id as receta_id, SUM(a.calorias_100g * ri.gramos / 100) as total
     FROM recetas r
     LEFT JOIN receta_items ri ON ri.receta_id = r.id
     LEFT JOIN alimentos a ON a.id = ri.alimento_id
     WHERE r.cliente_id = ?
     GROUP BY r.id`,
    clienteId
  );
  return Object.fromEntries(rows.map((r) => [r.receta_id, r.total ?? 0]));
}

/** Posición (1-based) de una receta entre las dietas de su cliente, por orden de creación — misma numeración que usa el resumen en PDF del cliente ("Dieta 1, Dieta 2…"), para que el nombre del archivo exportado coincida con ese resumen. */
export async function numeroRecetaParaCliente(recetaId: number, clienteId: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ numero: number }>(
    `SELECT COUNT(*) + 1 as numero FROM recetas
     WHERE cliente_id = ? AND creado_en < (SELECT creado_en FROM recetas WHERE id = ?)`,
    clienteId,
    recetaId
  );
  return row?.numero ?? 1;
}

export async function crearReceta(nombre: string, clienteId: number | null = null): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO recetas (nombre, observaciones, creado_en, cliente_id) VALUES (?, NULL, ?, ?)',
    nombre,
    new Date().toISOString(),
    clienteId
  );
  return res.lastInsertRowId;
}

export async function obtenerReceta(id: number): Promise<Receta | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM recetas WHERE id = ?', id);
  return row ? rowToReceta(row) : null;
}

export async function renombrarReceta(id: number, nombre: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE recetas SET nombre = ? WHERE id = ?', nombre, id);
}

export async function guardarObservaciones(id: number, observaciones: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE recetas SET observaciones = ? WHERE id = ?', observaciones, id);
}

export async function eliminarReceta(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM recetas WHERE id = ?', id);
}

export async function listarRecetaItems(recetaId: number): Promise<RecetaItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT ri.id as ri_id, ri.receta_id, ri.alimento_id, ri.gramos, ri.orden, ri.comida, ri.piezas, a.*
     FROM receta_items ri JOIN alimentos a ON a.id = ri.alimento_id
     WHERE ri.receta_id = ? ORDER BY ri.comida ASC, ri.orden ASC`,
    recetaId
  );
  return rows.map((r: any) => ({
    id: r.ri_id,
    recetaId: r.receta_id,
    alimentoId: r.alimento_id,
    gramos: r.gramos,
    orden: r.orden,
    comida: r.comida,
    piezas: r.piezas,
    alimento: rowToAlimento(r),
  }));
}

export async function agregarRecetaItem(
  recetaId: number,
  alimentoId: number,
  gramos: number,
  comida: number,
  piezas: number | null = null
): Promise<void> {
  const db = await getDb();
  const maxOrden = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(orden) as m FROM receta_items WHERE receta_id = ?',
    recetaId
  );
  const orden = (maxOrden?.m ?? -1) + 1;
  await db.runAsync(
    'INSERT INTO receta_items (receta_id, alimento_id, gramos, orden, comida, piezas) VALUES (?, ?, ?, ?, ?, ?)',
    recetaId,
    alimentoId,
    gramos,
    orden,
    comida,
    piezas
  );
}

// Vuelve a modo "gramos": el gramaje se edita directo y se descarta el
// conteo por piezas que pudiera tener el item.
export async function actualizarGramosItem(itemId: number, gramos: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE receta_items SET gramos = ?, piezas = NULL WHERE id = ?', gramos, itemId);
}

// Modo "piezas": gramos siempre se recalcula como piezas × gramosPorPieza,
// para que el cálculo de calorías/macros no tenga que saber de unidades.
export async function actualizarPiezasItem(itemId: number, piezas: number, gramos: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE receta_items SET piezas = ?, gramos = ? WHERE id = ?', piezas, gramos, itemId);
}

export async function eliminarRecetaItem(itemId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM receta_items WHERE id = ?', itemId);
}

export async function obtenerPreferencia(clave: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM preferencias WHERE clave = ?',
    clave
  );
  return row?.valor ?? null;
}

export async function guardarPreferencia(clave: string, valor: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO preferencias (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
    clave,
    valor
  );
}
