export const categories = [
    { id: 'none', name: 'Sin categoría', color: '#94a3b8' },
    { id: 'personal', name: 'Personal', color: '#6366f1' },
    { id: 'work', name: 'Trabajo', color: '#f59e0b' },
    { id: 'shopping', name: 'Compras', color: '#10b981' },
    { id: 'health', name: 'Salud', color: '#ef4444' },
    { id: 'ideas', name: 'Ideas', color: '#8b5cf6' }
];

export const priorities = [
    { id: 'none', name: 'Sin prioridad', color: '#94a3b8' },
    { id: 'low', name: 'Baja', color: '#10b981' },
    { id: 'medium', name: 'Media', color: '#f59e0b' },
    { id: 'high', name: 'Alta', color: '#ef4444' }
];

export const repeats = {
    none: '',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual'
};

export const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };

export function formatMinutes(min) {
    if (!min || min <= 0) return '';
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = date.getTime() - today.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));

    let label = '';
    let status = '';

    if (days < 0) {
        label = `Vencida hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
        status = 'overdue';
    } else if (days === 0) {
        label = 'Vence hoy';
        status = 'today';
    } else if (days === 1) {
        label = 'Vence mañana';
        status = 'tomorrow';
    } else if (days <= 7) {
        label = `Vence en ${days} días`;
        status = 'upcoming';
    } else {
        label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        status = 'future';
    }

    return { label, status, days };
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function generateId(tasks) {
    return tasks.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
}

export function sortTaskArray(arr, currentSort) {
    if (currentSort === 'default') {
        const pinned = arr.filter(t => t.pinned);
        const unpinned = arr.filter(t => !t.pinned);
        return [...pinned, ...unpinned];
    }
    const sorted = [...arr];
    sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (currentSort === 'priority') {
            return (priorityOrder[b.priority || 'none'] || 0) - (priorityOrder[a.priority || 'none'] || 0);
        } else if (currentSort === 'date') {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        } else if (currentSort === 'category') {
            return (a.category || 'none').localeCompare(b.category || 'none');
        } else if (currentSort === 'name') {
            return a.text.localeCompare(b.text);
        }
        return 0;
    });
    return sorted;
}
