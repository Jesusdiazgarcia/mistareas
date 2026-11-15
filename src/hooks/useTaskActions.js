import { useCallback } from 'react';
import { generateId } from '../utils/helpers';

export function useTaskActions({ tasks, syncTasks, addHistory, pushUndo, removeFromSelection }) {
    const addTask = useCallback((data) => {
        const newTask = {
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
        syncTasks([...tasks, newTask]);
        addHistory('created', data.text);
    }, [tasks, syncTasks, addHistory]);

    const toggleTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        pushUndo({ type: 'complete', id, prev: task.completed });

        let newTasks = tasks.map(t => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            return {
                ...t,
                completed,
                inProgress: completed ? false : t.inProgress,
                completedAt: completed ? new Date().toISOString() : null,
                startedAt: completed ? t.startedAt : (t.inProgress ? t.startedAt : null)
            };
        });

        if (!task.completed) {
            addHistory('completed', task.text);
            if (task.repeat && task.repeat !== 'none') {
                newTasks.push({
                    ...task, id: generateId(newTasks), completed: false, inProgress: false,
                    startedAt: null, completedAt: null,
                    createdAt: new Date().toISOString()
                });
                addHistory('created', `[Recurrente] ${task.text}`);
            }
        }

        syncTasks(newTasks);
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const deleteTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            pushUndo({ type: 'delete', task: { ...task } });
            addHistory('deleted', task.text);
        }
        syncTasks(tasks.filter(t => t.id !== id));
        removeFromSelection(id);
    }, [tasks, syncTasks, addHistory, pushUndo, removeFromSelection]);

    const togglePin = useCallback((id) => {
        syncTasks(tasks.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
    }, [tasks, syncTasks]);

    const editTask = useCallback((id, newText, prevText) => {
        pushUndo({ type: 'edit', id, prevText, newText });
        syncTasks(tasks.map(t => t.id === id ? { ...t, text: newText } : t));
    }, [tasks, syncTasks, pushUndo]);

    const saveNotes = useCallback((id, notes) => {
        syncTasks(tasks.map(t => t.id === id ? { ...t, notes } : t));
    }, [tasks, syncTasks]);

    const addSubtask = useCallback((taskId, text) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            return { ...t, subtasks: [...(t.subtasks || []), { text, completed: false }] };
        }));
    }, [tasks, syncTasks]);

    const toggleSubtask = useCallback((taskId, subIndex) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            const subtasks = t.subtasks.map((s, i) => i === subIndex ? { ...s, completed: !s.completed } : s);
            return { ...t, subtasks };
        }));
    }, [tasks, syncTasks]);

    const toggleInProgress = useCallback((id) => {
        syncTasks(tasks.map(t => {
            if (t.id !== id) return t;
            const newInProgress = !t.inProgress;
            return {
                ...t,
                inProgress: newInProgress,
                startedAt: newInProgress ? new Date().toISOString() : null
            };
        }));
    }, [tasks, syncTasks]);

    const moveKanbanTask = useCallback((taskId, status) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            if (status === 'completed') return { ...t, completed: true, inProgress: false, completedAt: new Date().toISOString() };
            if (status === 'in-progress') return { ...t, completed: false, inProgress: true, startedAt: new Date().toISOString() };
            return { ...t, completed: false, inProgress: false, startedAt: null, completedAt: null };
        }));
    }, [tasks, syncTasks]);

    const handleDragDrop = useCallback((draggedId, droppedId) => {
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const droppedIndex = tasks.findIndex(t => t.id === droppedId);
        if (draggedIndex === -1 || droppedIndex === -1) return;
        const newTasks = [...tasks];
        const [removed] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(droppedIndex, 0, removed);
        syncTasks(newTasks);
    }, [tasks, syncTasks]);

    return { addTask, toggleTask, deleteTask, togglePin, editTask, saveNotes, addSubtask, toggleSubtask, toggleInProgress, moveKanbanTask, handleDragDrop };
}
