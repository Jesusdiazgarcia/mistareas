import { useCallback, useState } from 'react';
import { clearStorageWarning, getStorageWarning, loadList, saveList } from '../utils/storage';

const HISTORY_LIMIT = 100;

/**
 * Estado de tareas e historial, guardado en este navegador.
 *
 * No hay sincronización externa: cada dispositivo/sesión tiene su propia lista.
 * Si el navegador rechaza un guardado, el hook expone `storageError` para que la
 * interfaz lo muestre en vez de fallar en silencio.
 */
export function useTaskStore() {
  const [tasks, setTasks] = useState(() => loadList('tasks'));
  const [history, setHistory] = useState(() => loadList('history'));
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

  const dismissStorageError = useCallback(() => {
    clearStorageWarning();
    setStorageError(null);
  }, []);

  return { tasks, syncTasks, history, syncHistory, storageError, dismissStorageError };
}
