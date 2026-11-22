import { useCallback, useMemo, useState } from 'react';

/** Selección múltiple de tareas visibles. */
export function useSelection(visibleTasks) {
    const [rawSelection, setRawSelection] = useState(() => new Set());

    // Descarta ids de tareas que ya no están visibles (borradas o filtradas fuera).
    const selectedIds = useMemo(() => {
        const alive = new Set(visibleTasks.map(t => t.id));
        const next = new Set([...rawSelection].filter(id => alive.has(id)));
        return next.size === rawSelection.size ? rawSelection : next;
    }, [rawSelection, visibleTasks]);

    const toggleSelect = useCallback((id) => {
        setRawSelection(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setRawSelection(prev => {
            const all = visibleTasks.map(t => t.id);
            const allSelected = all.length > 0 && all.every(id => prev.has(id));
            return allSelected ? new Set() : new Set(all);
        });
    }, [visibleTasks]);

    const clearSelection = useCallback(() => setRawSelection(new Set()), []);

    return { selectedIds, toggleSelect, selectAll, clearSelection };
}
