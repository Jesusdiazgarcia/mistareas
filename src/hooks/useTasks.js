import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFirebaseSync } from './useFirebaseSync';
import { generateId } from '../utils/helpers';
import { applyRedo, applyUndo, buildStatsText, createTask } from '../utils/taskModel';

const HISTORY_LIMIT = 100;

/**
 * Estado y operaciones de tareas: persistencia (Firebase + localStorage),
 * CRUD, historial y deshacer/rehacer.
 */
export function useTasks() {
    const { tasks, syncTasks, history, syncHistory, isSyncing, syncStatus } = useFirebaseSync();
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const undoRef = useRef(null);
    const redoRef = useRef(null);

    const addHistory = useCallback((type, text) => {
        const entry = { type, text: text.substring(0, 50), timestamp: new Date().toISOString() };
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
        syncTasks(prev => [...prev, createTask(data, prev)]);
        addHistory('created', data.text);
    }, [syncTasks, addHistory]);

    const toggleTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        pushUndo({ type: 'complete', id, prev: task.completed });
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
            addHistory('completed', task.text);
            if (task.repeat && task.repeat !== 'none') addHistory('created', `[Recurrente] ${task.text}`);
        }
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const deleteTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            pushUndo({ type: 'delete', task: { ...task } });
            addHistory('deleted', task.text);
        }
        syncTasks(prev => prev.filter(t => t.id !== id));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const deleteMany = useCallback((ids) => {
        const idSet = new Set(ids);
        if (idSet.size === 0) return;
        const removed = tasks.filter(t => idSet.has(t.id));
        pushUndo({ type: 'bulk-delete', tasks: removed.map(t => ({ ...t })) });
        removed.forEach(t => addHistory('deleted', t.text));
        syncTasks(prev => prev.filter(t => !idSet.has(t.id)));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const clearCompleted = useCallback(() => {
        const completed = tasks.filter(t => t.completed);
        if (completed.length === 0) return;
        pushUndo({ type: 'bulk-delete', tasks: completed.map(t => ({ ...t })) });
        completed.forEach(t => addHistory('deleted', t.text));
        syncTasks(prev => prev.filter(t => !t.completed));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const setCategoryForMany = useCallback((ids, category) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        const previous = tasks.find(t => idSet.has(t.id))?.category || 'none';
        pushUndo({ type: 'bulk-category', ids: [...idSet], prevCategory: previous, newCategory: category });
        syncTasks(prev => prev.map(t => (idSet.has(t.id) ? { ...t, category } : t)));
    }, [tasks, syncTasks, pushUndo]);

    const togglePin = useCallback((id) => {
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
    }, [syncTasks]);

    const editTask = useCallback((id, newText, prevText) => {
        pushUndo({ type: 'edit', id, prevText, newText });
        syncTasks(prev => prev.map(t => (t.id === id ? { ...t, text: newText } : t)));
    }, [syncTasks, pushUndo]);

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
        syncTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const inProgress = !t.inProgress;
            return { ...t, inProgress, startedAt: inProgress ? new Date().toISOString() : null };
        }));
    }, [syncTasks]);

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

    const statsText = useMemo(() => buildStatsText(tasks), [tasks]);

    return {
        tasks,
        syncTasks,
        history,
        isSyncing,
        syncStatus,
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
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0
    };
}
