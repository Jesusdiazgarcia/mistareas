/**
 * Estado de tareas e historial guardado localmente en el navegador.
 *
 * Comportamiento actual: cada dispositivo/sesión tiene su propia lista.
 * No hay sincronización con Firebase. Todo queda en localStorage.
 */

const LS_KEYS = { tasks: 'tasks', history: 'history', theme: 'theme' };

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useFirebaseSync() {
  const [tasks, setTasks] = useState(() => loadLocal(LS_KEYS.tasks, []));
  const [history, setHistory] = useState(() => loadLocal(LS_KEYS.history, []));

  const syncTasks = useCallback(
    (newTasksOrFn) => {
      const newTasks = typeof newTasksOrFn === 'function' ? newTasksOrFn(tasks) : newTasksOrFn;
      setTasks(newTasks);
      saveLocal(LS_KEYS.tasks, newTasks);
    },
    [tasks]
  );

  const syncHistory = useCallback(
    (newHistoryOrFn) => {
      const newHistory = typeof newHistoryOrFn === 'function' ? newHistoryOrFn(history) : newHistoryOrFn;
      setHistory(newHistory);
      saveLocal(LS_KEYS.history, newHistory.slice(0, 100));
    },
    [history]
  );

  return { tasks, syncTasks, history, syncHistory, isSyncing: false, syncStatus: 'local' };
}
