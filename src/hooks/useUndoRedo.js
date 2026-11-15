import { useState, useCallback, useRef, useEffect } from 'react';

export function useUndoRedo({ tasks, syncTasks }) {
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const undoRef = useRef(null);
    const redoRef = useRef(null);

    const pushUndo = useCallback((action) => {
        setUndoStack(prev => [...prev.slice(-49), action]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, action]);

        let newTasks = [...tasks];
        if (action.type === 'delete') newTasks.push(action.task);
        else if (action.type === 'complete') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) { task.completed = action.prev; if (!action.prev) task.inProgress = false; }
        } else if (action.type === 'bulk-delete') {
            newTasks.push(...action.tasks);
        } else if (action.type === 'bulk-category') {
            action.ids.forEach(id => { const task = newTasks.find(t => t.id === id); if (task) task.category = action.prevCategory; });
        } else if (action.type === 'edit') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.text = action.prevText;
        } else if (action.type === 'toggle-progress') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.inProgress = action.prev;
        }
        syncTasks(newTasks);
    }, [undoStack, tasks, syncTasks]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, action]);

        let newTasks = [...tasks];
        if (action.type === 'delete') newTasks = newTasks.filter(t => t.id !== action.task.id);
        else if (action.type === 'complete') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) { task.completed = !action.prev; if (!action.prev) task.inProgress = false; }
        } else if (action.type === 'bulk-delete') {
            const ids = new Set(action.tasks.map(t => t.id));
            newTasks = newTasks.filter(t => !ids.has(t.id));
        } else if (action.type === 'bulk-category') {
            action.ids.forEach(id => { const task = newTasks.find(t => t.id === id); if (task) task.category = action.newCategory; });
        } else if (action.type === 'edit') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.text = action.newText;
        } else if (action.type === 'toggle-progress') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.inProgress = !action.prev;
        }
        syncTasks(newTasks);
    }, [redoStack, tasks, syncTasks]);

    // Keep refs up to date for keyboard shortcuts
    useEffect(() => {
        undoRef.current = undo;
        redoRef.current = redo;
    }, [undo, redo]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault(); undoRef.current?.();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Z')) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault(); redoRef.current?.();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return { undo, redo, pushUndo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}
