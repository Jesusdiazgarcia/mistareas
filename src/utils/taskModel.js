import { generateId, sortTaskArray } from './helpers';

/** Crea una tarea nueva a partir de los datos del composer. */
export function createTask(data, tasks) {
    return {
        id: generateId(tasks),
        text: data.text,
        completed: false,
        inProgress: false,
        pinned: false,
        category: data.category,
        priority: data.priority,
        repeat: data.repeat,
        dueDate: data.dueDate,
        subtasks: [],
        notes: data.notes,
        estimatedMinutes: data.estimatedMinutes,
        createdAt: new Date().toISOString()
    };
}

/** Convierte una tarea parseada de un archivo (TXT/PDF) en tarea de la app. */
export function createImportedTask(parsed, index, tasks) {
    return {
        id: generateId(tasks) + index,
        text: parsed.text,
        completed: false,
        inProgress: false,
        pinned: false,
        category: parsed.category,
        priority: parsed.priority,
        repeat: 'none',
        dueDate: null,
        subtasks: [],
        notes: parsed.notes || '',
        estimatedMinutes: 0,
        createdAt: new Date().toISOString()
    };
}

/** Filtra y ordena según el estado de la barra de filtros. */
export function filterTasks(tasks, { filter, search, filterCategory, filterPriority, sort }) {
    const term = search.trim().toLowerCase();
    let result = tasks;

    if (filter === 'pending') result = result.filter(t => !t.completed && !t.inProgress);
    else if (filter === 'inprogress') result = result.filter(t => !t.completed && t.inProgress);
    else if (filter === 'completed') result = result.filter(t => t.completed);
    else if (filter === 'recurring') result = result.filter(t => t.repeat && t.repeat !== 'none');

    if (term) result = result.filter(t => t.text.toLowerCase().includes(term));
    if (filterCategory !== 'all') result = result.filter(t => (t.category || 'none') === filterCategory);
    if (filterPriority !== 'all') result = result.filter(t => (t.priority || 'none') === filterPriority);

    return sortTaskArray(result, sort);
}

/** Texto de resumen que se muestra bajo la cabecera. */
export function buildStatsText(tasks) {
    const pending = tasks.filter(t => !t.completed).length;
    if (tasks.length === 0) return '0 tareas pendientes';
    if (pending === 0) return `Todas completadas! (${tasks.length})`;

    const totalEst = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
    const estimate = totalEst > 0
        ? ` · ~${totalEst < 60 ? `${totalEst}min` : `${Math.floor(totalEst / 60)}h ${totalEst % 60}min`} restantes`
        : '';

    return `${pending} tarea${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''}${estimate}`;
}

function patchById(tasks, id, patch) {
    return tasks.map(t => (t.id === id ? { ...t, ...patch } : t));
}

/** Aplica una acción del historial de deshacer. */
export function applyUndo(tasks, action) {
    switch (action.type) {
        case 'delete':
            return [...tasks, action.task];
        case 'bulk-delete':
            return [...tasks, ...action.tasks];
        case 'complete':
            return tasks.map(t => (t.id === action.id
                ? { ...t, completed: action.prev, inProgress: action.prev ? t.inProgress : false }
                : t));
        case 'bulk-category': {
            const ids = new Set(action.ids);
            return tasks.map(t => (ids.has(t.id) ? { ...t, category: action.prevCategory } : t));
        }
        case 'edit':
            return patchById(tasks, action.id, { text: action.prevText });
        case 'toggle-progress':
            return patchById(tasks, action.id, { inProgress: action.prev });
        default:
            return tasks;
    }
}

/** Aplica una acción del historial de rehacer. */
export function applyRedo(tasks, action) {
    switch (action.type) {
        case 'delete':
            return tasks.filter(t => t.id !== action.task.id);
        case 'bulk-delete': {
            const ids = new Set(action.tasks.map(t => t.id));
            return tasks.filter(t => !ids.has(t.id));
        }
        case 'complete':
            return tasks.map(t => (t.id === action.id
                ? { ...t, completed: !action.prev, inProgress: !action.prev ? false : t.inProgress }
                : t));
        case 'bulk-category': {
            const ids = new Set(action.ids);
            return tasks.map(t => (ids.has(t.id) ? { ...t, category: action.newCategory } : t));
        }
        case 'edit':
            return patchById(tasks, action.id, { text: action.newText });
        case 'toggle-progress':
            return patchById(tasks, action.id, { inProgress: !action.prev });
        default:
            return tasks;
    }
}
