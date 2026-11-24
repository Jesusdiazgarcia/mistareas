import { useState } from 'react';
import { loadList, saveList } from '../utils/storage';
import { dateKey } from '../utils/helpers';

/** Resumen al abrir: cuántas tareas quedaron vencidas de días anteriores. */
export default function DueSummary({ tasks, onOpenToday }) {
    const [ack, setAck] = useState(() => loadList('overdueAck')[0] || null);
    const today = dateKey();
    const overdue = tasks.filter(task => !task.completed && task.dueDate && task.dueDate < today);

    if (overdue.length === 0 || ack === today) return null;

    const dismiss = () => {
        setAck(today);
        saveList('overdueAck', [today]);
    };

    return (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5">
            <p className="flex-1 text-[11.5px] leading-snug text-[var(--text-secondary)]">
                {overdue.length} tarea{overdue.length === 1 ? '' : 's'} vencida{overdue.length === 1 ? '' : 's'} de días anteriores.
            </p>
            <button onClick={onOpenToday}
                className="shrink-0 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]">
                Ver en Hoy
            </button>
            <button onClick={dismiss} aria-label="Ocultar aviso de vencidas"
                className="shrink-0 w-7 h-7 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
        </div>
    );
}
