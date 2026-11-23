/**
 * Acceso al almacenamiento local con claves versionadas y fallos visibles.
 *
 * Reglas:
 * - Las claves llevan prefijo y versión (mis_tareas:v1:...) para poder migrar.
 * - Si el contenido guardado está dañado, se conserva una copia cruda antes de
 *   continuar, en lugar de sobrescribirlo sin dejar rastro.
 * - Si el navegador rechaza una escritura (cuota llena, modo privado), el error
 *   se devuelve para que la interfaz avise. Nunca se traga en silencio.
 */

const PREFIX = 'mis_tareas:v1:';
const CORRUPT_PREFIX = 'mis_tareas:respaldo-danado:';
const LEGACY_KEYS = { tasks: 'tasks', history: 'history', theme: 'theme' };

let pendingWarning = null;

export function getStorageWarning() {
  return pendingWarning;
}

export function clearStorageWarning() {
  pendingWarning = null;
}

function parseArray(raw) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? { ok: true, value } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function readRaw(key) {
  try {
    return { ok: true, raw: localStorage.getItem(key) };
  } catch {
    return { ok: false, raw: null };
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return null;
  } catch (error) {
    const quota = error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22);
    return quota
      ? 'El navegador se quedó sin espacio para guardar. Exporta un respaldo y libera datos del sitio.'
      : 'No se pudieron guardar los cambios en este navegador. Puede estar en modo privado o con el almacenamiento bloqueado.';
  }
}

/** Lee una lista (tasks/history) migrando desde la clave antigua si hace falta. */
export function loadList(name) {
  const key = PREFIX + name;
  const current = readRaw(key);

  if (!current.ok) {
    pendingWarning = 'Este navegador no permite leer el almacenamiento local. La app funcionará, pero nada se guardará.';
    return [];
  }

  if (current.raw === null) {
    const legacyKey = LEGACY_KEYS[name];
    const legacy = readRaw(legacyKey);
    if (legacy.ok && legacy.raw) {
      const parsed = parseArray(legacy.raw);
      if (parsed.ok) {
        writeRaw(key, legacy.raw);
        return parsed.value;
      }
    }
    return [];
  }

  const parsed = parseArray(current.raw);
  if (!parsed.ok) {
    writeRaw(`${CORRUPT_PREFIX}${name}:${Date.now()}`, current.raw);
    pendingWarning = `Los datos guardados de "${name}" estaban dañados y no se pudieron leer. Se conservó una copia del contenido original en este navegador.`;
    return [];
  }

  return parsed.value;
}

/** Guarda una lista y devuelve un mensaje de error, o null si todo fue bien. */
export function saveList(name, value) {
  return writeRaw(PREFIX + name, JSON.stringify(value));
}

/** Copia cruda de las listas guardadas, para respaldos de emergencia. */
export function readRawBackup() {
  const snapshot = {};
  for (const name of ['tasks', 'history']) {
    const current = readRaw(PREFIX + name);
    const legacy = readRaw(LEGACY_KEYS[name]);
    const raw = current.ok && current.raw ? current.raw : legacy.ok ? legacy.raw : null;
    if (!raw) continue;
    try {
      snapshot[name] = JSON.parse(raw);
    } catch {
      snapshot[name] = raw;
    }
  }
  return snapshot;
}
