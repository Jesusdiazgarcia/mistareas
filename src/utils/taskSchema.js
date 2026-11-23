/**
 * Validación y normalización de tareas importadas.
 *
 * Ningún archivo externo entra tal cual: se comprueba la forma de cada tarea y
 * los campos desconocidos se descartan. Así una importación no puede dejar la
 * lista en un estado que rompa la app.
 */

const MAX_TASKS = 5000;
const MAX_TEXT = 500;
const MAX_NOTES = 5000;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function asDateOrNull(value) {
  if (typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(item => isObject(item) && typeof item.text === 'string' && item.text.trim())
    .slice(0, 100)
    .map(item => ({ text: asText(item.text.trim(), 200), completed: Boolean(item.completed) }));
}

export function normalizeTask(raw, fallbackId) {
  if (!isObject(raw)) return null;

  const text = asText(typeof raw.text === 'string' ? raw.text.trim() : '', MAX_TEXT);
  if (!text) return null;

  return {
    id: Number.isFinite(raw.id) ? raw.id : fallbackId,
    text,
    completed: Boolean(raw.completed),
    inProgress: Boolean(raw.inProgress) && !raw.completed,
    pinned: Boolean(raw.pinned),
    category: typeof raw.category === 'string' ? raw.category : 'none',
    priority: typeof raw.priority === 'string' ? raw.priority : 'none',
    repeat: typeof raw.repeat === 'string' ? raw.repeat : 'none',
    dueDate: asDateOrNull(raw.dueDate),
    subtasks: normalizeSubtasks(raw.subtasks),
    notes: asText(raw.notes, MAX_NOTES),
    estimatedMinutes: Number.isFinite(raw.estimatedMinutes) && raw.estimatedMinutes > 0 ? raw.estimatedMinutes : 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  };
}

/**
 * Convierte texto JSON en tareas válidas.
 * Devuelve { ok, tasks, rejected } o { ok: false, error }.
 */
export function parseTasksJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'El JSON debe contener una lista de tareas.' };
  }

  if (parsed.length === 0) {
    return { ok: false, error: 'El archivo no contiene tareas.' };
  }

  if (parsed.length > MAX_TASKS) {
    return { ok: false, error: `El archivo tiene demasiadas entradas (máximo ${MAX_TASKS}).` };
  }

  const tasks = [];
  let rejected = 0;
  parsed.forEach((item, index) => {
    const task = normalizeTask(item, index + 1);
    if (task) tasks.push(task);
    else rejected += 1;
  });

  if (tasks.length === 0) {
    return { ok: false, error: 'Ninguna entrada tiene el formato de tarea esperado (falta el texto).' };
  }

  return { ok: true, tasks, rejected };
}

/** Valida un respaldo completo { tasks, history }. */
export function parseBackupJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: 'El respaldo no tiene el formato esperado.' };
  }

  const tasksResult = parseTasksJson(JSON.stringify(Array.isArray(parsed.tasks) ? parsed.tasks : []));
  if (!tasksResult.ok) {
    return { ok: false, error: `Respaldo inválido: ${tasksResult.error}` };
  }

  const history = Array.isArray(parsed.history)
    ? parsed.history
      .filter(item => isObject(item) && typeof item.text === 'string')
      .slice(0, 100)
      .map(item => ({
        type: typeof item.type === 'string' ? item.type : 'info',
        text: asText(item.text, 50),
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date().toISOString()
      }))
    : [];

  return { ok: true, tasks: tasksResult.tasks, history, rejected: tasksResult.rejected };
}

/** Reasigna ids para poder añadir tareas a una lista existente sin colisiones. */
export function mergeTasks(incoming, existing) {
  const nextId = existing.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;
  return incoming.map((task, index) => ({ ...task, id: nextId + index }));
}
