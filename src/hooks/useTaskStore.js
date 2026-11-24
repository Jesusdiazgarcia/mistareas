import { useCallback, useState } from 'react';
import { clearStorageWarning, getStorageWarning, loadList, saveList } from '../utils/storage';
import { FOCUS_LIMIT } from '../utils/helpers';

const HISTORY_LIMIT = 100;
const TRASH_DAYS = 7;

/** Descarta de la papelera lo que ya superó el periodo de retención. */
function pruneTrash(entries) {
  const limit = Date.now() - TRASH_DAYS * 86400000;
  return entries.filter(entry => {
    const deleted = new Date(entry?.deletedAt).getTime();
    return Number.isFinite(deleted) && deleted >= limit;
  });
}

/**
 * Estado de tareas, historial y papelera, guardado en este navegador.
 *
 * No hay sincronización externa: cada dispositivo/sesión tiene su propia lista.
 * Si el navegador rechaza un guardado, el hook expone `storageError` para que la
 * interfaz lo muestre en vez de fallar en silencio.
 */
export function useTaskStore() {
  const [tasks, setTasks] = useState(() => loadList('tasks'));
  const [history, setHistory] = useState(() => loadList('history'));
  const [trash, setTrash] = useState(() => pruneTrash(loadList('trash')));
  const [focus, setFocus] = useState(() => loadList('focus').filter(id => typeof id === 'number'));
  const [storageError, setStorageError] = useState(() => getStorageWarning());

  const syncTasks = useCallback(
    (newTasksOrFn) => {
      const newTasks = typeof newTasksOrFn === 'function' ? newTasksOrFn(tasks) : newTasksOrFn;
      setTasks(newTasks);
      setStorageError(saveList('tasks', newTasks));
    },
    [tasks]
  );

  const syncHistory = useCallback(
    (newHistoryOrFn) => {
      const newHistory = typeof newHistoryOrFn === 'function' ? newHistoryOrFn(history) : newHistoryOrFn;
      const trimmed = newHistory.slice(0, HISTORY_LIMIT);
      setHistory(trimmed);
      const error = saveList('history', trimmed);
      if (error) setStorageError(error);
    },
    [history]
  );

  const syncTrash = useCallback(
    (newTrashOrFn) => {
      const next = typeof newTrashOrFn === 'function' ? newTrashOrFn(trash) : newTrashOrFn;
      const trimmed = pruneTrash(next);
      setTrash(trimmed);
      const error = saveList('trash', trimmed);
      if (error) setStorageError(error);
    },
    [trash]
  );

  /** Guarda las tareas foco del día (máximo 3). */
  const syncFocus = useCallback(
    (newFocusOrFn) => {
      const next = typeof newFocusOrFn === 'function' ? newFocusOrFn(focus) : newFocusOrFn;
      const trimmed = [...new Set(next)].filter(id => typeof id === 'number').slice(0, FOCUS_LIMIT);
      setFocus(trimmed);
      const error = saveList('focus', trimmed);
      if (error) setStorageError(error);
    },
    [focus]
  );

  /** Mueve tareas a la papelera sin duplicar las que ya estaban. */
  const addToTrash = useCallback((items) => {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) return;
    syncTrash(prev => {
      const existing = new Set(prev.map(entry => entry.task?.id));
      const incoming = list
        .filter(task => task && !existing.has(task.id))
        .map(task => ({ task: { ...task }, deletedAt: new Date().toISOString() }));
      return incoming.length > 0 ? [...incoming, ...prev] : prev;
    });
  }, [syncTrash]);

  const removeFromTrash = useCallback((ids) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    syncTrash(prev => prev.filter(entry => !idSet.has(entry.task?.id)));
  }, [syncTrash]);

  const dismissStorageError = useCallback(() => {
    clearStorageWarning();
    setStorageError(null);
  }, []);

  return {
    tasks,
    syncTasks,
    history,
    syncHistory,
    trash,
    focus,
    syncFocus,
    addToTrash,
    removeFromTrash,
    clearTrash: () => syncTrash([]),
    storageError,
    dismissStorageError
  };
}
