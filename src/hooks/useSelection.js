import { useState, useCallback } from 'react';
import { generateTasksICS, downloadICS } from '../utils/calendarExport';

export function useSelection({ tasks, filteredTasks, syncTasks, addHistory, pushUndo }) {
    const [selectedIds, setSelectedIds] = useState(new Set());

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.size === filteredTasks.length) return new Set();
            return new Set(filteredTasks.map(t => t.id));
        });
    }, [filteredTasks]);

    const removeFromSelection = useCallback((id) => {
        setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, []);

    const bulkDelete = useCallback(() => {
        const toDelete = tasks.filter(t => selectedIds.has(t.id));
        pushUndo({ type: 'bulk-delete', tasks: toDelete.map(t => ({ ...t })) });
        toDelete.forEach(t => addHistory('deleted', t.text));
        syncTasks(tasks.filter(t => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
    }, [tasks, selectedIds, syncTasks, addHistory, pushUndo]);

    const bulkChangeCategory = useCallback((catId) => {
        const firstCat = tasks.find(t => selectedIds.has(t.id))?.category || 'none';
        pushUndo({ type: 'bulk-category', ids: [...selectedIds], prevCategory: firstCat, newCategory: catId });
        syncTasks(tasks.map(t => selectedIds.has(t.id) ? { ...t, category: catId } : t));
    }, [tasks, selectedIds, syncTasks, pushUndo]);

    const clearCompleted = useCallback(() => {
        const completed = tasks.filter(t => t.completed);
        pushUndo({ type: 'bulk-delete', tasks: completed.map(t => ({ ...t })) });
        completed.forEach(t => addHistory('deleted', t.text));
        syncTasks(tasks.filter(t => !t.completed));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const exportSelectedToCalendar = useCallback(() => {
        const selected = tasks.filter(t => selectedIds.has(t.id));
        if (selected.length === 0) return;
        const ics = generateTasksICS(selected);
        downloadICS('tareas_seleccionadas.ics', ics);
    }, [tasks, selectedIds]);

    return { selectedIds, toggleSelect, selectAll, removeFromSelection, bulkDelete, bulkChangeCategory, clearCompleted, exportSelectedToCalendar };
}
