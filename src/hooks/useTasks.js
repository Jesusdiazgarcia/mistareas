import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTaskStore } from './useTaskStore';
import { generateId, dateKey, FOCUS_LIMIT } from '../utils/helpers';
import { applyRedo, applyUndo, buildStatsText, createTask } from '../utils/taskModel';

const HISTORY_LIMIT = 100;

/**
 * Estado y operaciones de tareas: persistencia local en el navegador,
 * CRUD, historial con deshacer, papelera y deshacer/rehacer rápido.
 *
 * Nota de modelo de datos:
 * - En esta build no hay sincronización externa; la app usa localStorage.
 * - Cada dispositivo/sesión tiene su propia lista.
 */
export function useTasks() {
    const {
        tasks,
        syncTasks,
        history,
        syncHistory,
        focus,
        syncFocus,
        trash,
        addToTrash,
        removeFromTrash,
        clearTrash,
        storageError,
        dismissStorageError
    } = useTaskStore();

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const undoRef = useRef(null);
    const redoRef = useRef(null);

    /** addHistory(type, texto, acción): la acción permite deshacer desde el historial. */
    const addHistory = useCallback((type, text, action = null) => {
        const entry = { type, text: String(text).substring(0, 50), timestamp: new Date().toISOString() };
        if (action) entry.action = action;
        syncHistory(prev => [entry, ...prev].slice(0, HISTORY_LIMIT));
    }, [syncHistory]);

    const pushUndo = useCallback((action) => {
        setUndoStack(prev => [...prev.slice(-49), action]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, action]);
        syncTasks(prev => applyUndo(prev, action));
    }, [undoStack, syncTasks]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, action]);
        syncTasks(prev => applyRedo(prev, action));
    }, [redoStack, syncTasks]);

    // Atajos de teclado: Ctrl/Cmd + Z, Ctrl/Cmd + Y.
    useEffect(() => {
        undoRef.current = undo;
        redoRef.current = redo;
    }, [undo, redo]);

    useEffect(() => {
        const handler = (event) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key === 'z') {
                event.preventDefault();
                undoRef.current?.();
            } else if (event.key === 'y' || event.key === 'Z') {
                event.preventDefault();
                redoRef.current?.();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const addTask = useCallback((data) => {
        const task = createTask(data, tasks);
        syncTasks(prev => [...prev, task]);
        addHistory('created', data.text, { kind: 'created', id: task.id });
    }, [tasks, syncTasks, addHistory]);

    const toggleTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const action = { type: 'complete', id, prev: task.completed };
        pushUndo(action);
        const completing = !task.completed;
        const now = new Date().toISOString();

        syncTasks(prev => {
            let next = prev.map(t => {
                if (t.id !== id) return t;
                return {
                    ...t,
                    completed: !t.completed,
                    inProgress: !t.completed ? false : t.inProgress,
                    completedAt: !t.completed ? now : null,
                    startedAt: !t.completed ? t.startedAt : (t.inProgress ? t.startedAt : null)
                };
            });
            if (completing && task.repeat && task.repeat !== 'none') {
                next = [...next, {
                    ...task,
                    id: generateId(next),
                    completed: false,
                    inProgress: false,
                    startedAt: null,
                    completedAt: null,
                    createdAt: now
                }];
            }
            return next;
        });

        if (completing) {
            addHistory('completed', task.text, action);
            if (task.repeat && task.repeat !== 'none') addHistory('created', `[Recurrente] ${task.text}`);
        }
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const deleteTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const action = { type: 'delete', task: { ...task } };
        pushUndo(action);
        addToTrash(task);
        addHistory('deleted', task.text, action);
        syncTasks(prev => prev.filter(t => t.id !== id));
    }, [tasks, syncTasks, addHistory, pushUndo, addToTrash]);

    const deleteMany = useCallback((ids) => {
        const idSet = new Set(ids);
        if (idSet.size === 0) return;
        const removed = tasks.filter(t => idSet.has(t.id));
        if (removed.length === 0) return;
        const action = { type: 'bulk-delete', tasks: removed.map(t => ({ ...t })) };
        pushUndo(action);
        addToTrash(removed);
        addHistory('deleted', `${removed.length} tareas`, action);
        syncTasks(prev => prev.filter(t => !idSet.has(t.id)));
    }, [tasks, syncTasks, addHistory, pushUndo, addToTrash]);

    const clearCompleted = useCallback(() => {
        const completed = tasks.filter(t => t.completed);
        if (completed.length === 0) return;
        const action = { type: 'bulk-delete', tasks: completed.map(t => ({ ...t })) };
        pushUndo(action);
        addToTrash(completed);
        addHistory('deleted', `${completed.length} completadas`, action);
        syncTasks(prev => prev.filter(t => !t.completed));
    }, [tasks, syncTasks, addHistory, pushUndo, addToTrash]);

    const setCategoryForMany = useCallback((ids, category) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        const previous = tasks.find(t => idSet.has(t.id))?.category || 'none';
        const action = { type: 'bulk-category', ids: [...idSet], prevCategory: previous, newCategory: category };
        pushUndo(action);
        addHistory('edit', `Categoría de ${idSet.size} tareas`, action);
        syncTasks(prev => prev.map(t => (idSet.has(t.id) ? { ...t, category } : t)));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const togglePin = useCallback((id) => {
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
    }, [syncTasks]);

    const editTask = useCallback((id, newText, prevText) => {
        const action = { type: 'edit', id, prevText, newText };
        pushUndo(action);
        addHistory('edit', newText, action);
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, text: newText } : t)));
    }, [syncTasks, pushUndo, addHistory]);

    const saveNotes = useCallback((id, notes) => {
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, notes } : t)));
    }, [syncTasks]);

    const addSubtask = useCallback((taskId, text) => {
        syncTasks(prev => prev.map(t => (
            t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { text, completed: false }] } : t
        )));
    }, [syncTasks]);

    const toggleSubtask = useCallback((taskId, subIndex) => {
        syncTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            const subtasks = t.subtasks.map((sub, i) => (i === subIndex ? { ...sub, completed: !sub.completed } : sub));
            return { ...t, subtasks };
        }));
    }, [syncTasks]);

    const toggleInProgress = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const action = { type: 'toggle-progress', id, prev: Boolean(task.inProgress) };
        pushUndo(action);
        syncTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const inProgress = !t.inProgress;
            return { ...t, inProgress, startedAt: inProgress ? new Date().toISOString() : null };
        }));
    }, [tasks, syncTasks, pushUndo]);

    const moveKanbanTask = useCallback((taskId, status) => {
        const now = new Date().toISOString();
        syncTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            if (status === 'completed') return { ...t, completed: true, inProgress: false, completedAt: now };
            if (status === 'in-progress') return { ...t, completed: false, inProgress: true, startedAt: now };
            return { ...t, completed: false, inProgress: false, startedAt: null, completedAt: null };
        }));
    }, [syncTasks]);

    const reorder = useCallback((draggedId, droppedId) => {
        syncTasks(prev => {
            const from = prev.findIndex(t => t.id === draggedId);
            const to = prev.findIndex(t => t.id === droppedId);
            if (from === -1 || to === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }, [syncTasks]);

    /** Restaura una tarea de la papelera a la lista activa. */
    const restoreFromTrash = useCallback((id) => {
        const entry = trash.find(item => item.task?.id === id);
        if (!entry) return;
        syncTasks(prev => (prev.some(t => t.id === entry.task.id) ? prev : [...prev, entry.task]));
        removeFromTrash(id);
        addHistory('created', entry.task.text);
    }, [trash, syncTasks, removeFromTrash, addHistory]);

    /** Elimina definitivamente una tarea de la papelera. */
    const deleteForever = useCallback((id) => {
        removeFromTrash(id);
    }, [removeFromTrash]);

    const emptyTrash = useCallback(() => {
        clearTrash();
    }, [clearTrash]);

    /** Deshace una acción concreta desde el historial. */
    const undoHistoryEntry = useCallback((index) => {
        const entry = history[index];
        if (!entry || !entry.action) return;

        const action = entry.action;
        if (action.kind === 'created') {
            syncTasks(prev => prev.filter(t => t.id !== action.id));
        } else {
            syncTasks(prev => applyUndo(prev, action));
            if (action.type === 'delete') removeFromTrash(action.task.id);
            if (action.type === 'bulk-delete') removeFromTrash(action.tasks.map(t => t.id));
        }
        syncHistory(prev => prev.filter((_, i) => i !== index));
    }, [history, syncTasks, syncHistory, removeFromTrash]);

    /** Reprograma fecha y hora; sin hora se conserva la que tenía. */
    const rescheduleTask = useCallback((id, dueDate, dueTime) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const nextDate = dueDate || null;
        const nextTime = dueTime === undefined ? (nextDate ? (task.dueTime || null) : null) : (dueTime || null);
        const action = {
            type: 'reschedule',
            id,
            prevDate: task.dueDate || null,
            prevTime: task.dueTime || null,
            nextDate,
            nextTime
        };
        pushUndo(action);
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, dueDate: nextDate, dueTime: nextTime } : t)));
    }, [tasks, syncTasks, pushUndo]);

    /** Pospone una tarea: 0= hoy, 1= mañana, 7= en una semana, null= sin fecha. */
    const snoozeTask = useCallback((id, days) => {
        if (days === null) {
            rescheduleTask(id, null, null);
            return;
        }
        const target = new Date();
        target.setDate(target.getDate() + days);
        rescheduleTask(id, dateKey(target));
    }, [rescheduleTask]);

    /** Pasa todas las vencidas a mañana, con deshacer. */
    const rescheduleOverdue = useCallback(() => {
        const today = dateKey(new Date());
        const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today);
        if (overdue.length === 0) return;
        const target = new Date();
        target.setDate(target.getDate() + 1);
        const nextDate = dateKey(target);
        const action = {
            type: 'bulk-reschedule',
            ids: overdue.map(t => t.id),
            prev: overdue.map(t => ({ id: t.id, dueDate: t.dueDate, dueTime: t.dueTime || null })),
            nextDate
        };
        pushUndo(action);
        const ids = new Set(action.ids);
        syncTasks(prev => prev.map(t => (ids.has(t.id) ? { ...t, dueDate: nextDate } : t)));
        addHistory('edit', `${overdue.length} vencidas a mañana`, action);
    }, [tasks, syncTasks, pushUndo, addHistory]);

    const focusIds = useMemo(() => focus.filter(id => tasks.some(t => t.id === id)), [focus, tasks]);

    /** Alterna una tarea en Mi día, con tope de tres. */
    const toggleFocus = useCallback((id) => {
        syncFocus(prev => {
            if (prev.includes(id)) return prev.filter(item => item !== id);
            if (prev.length >= FOCUS_LIMIT) return prev;
            return [...prev, id];
        });
    }, [syncFocus]);

    const clearFocus = useCallback(() => syncFocus([]), [syncFocus]);

    const statsText = useMemo(() => buildStatsText(tasks), [tasks]);

    return {
        tasks,
        syncTasks,
        history,
        trash,
        storageError,
        dismissStorageError,
        statsText,
        addHistory,
        addTask,
        toggleTask,
        deleteTask,
        deleteMany,
        clearCompleted,
        setCategoryForMany,
        togglePin,
        editTask,
        saveNotes,
        addSubtask,
        toggleSubtask,
        toggleInProgress,
        moveKanbanTask,
        reorder,
        restoreFromTrash,
        deleteForever,
        emptyTrash,
        rescheduleTask,
        snoozeTask,
        rescheduleOverdue,
        focusIds,
        toggleFocus,
        clearFocus,
        undoHistoryEntry,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0
    };
}
