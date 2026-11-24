import { formatMinutes, dateKey } from '../utils/helpers';

function Stat({ value, label, color }) {
    return (
        <div className="border-t border-[var(--border)] pt-3">
            <div className="brand-type figure text-[24px] leading-none" style={{ color }}>{value}</div>
            <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</div>
        </div>
    );
}

/** Cierre del día: qué se hizo, qué quedó vencido y atajo para pasarlo a mañana. */
export default function DayReview({ tasks, onRescheduleOverdue, onOpenToday }) {
    const today = dateKey();
    const completedToday = tasks.filter(task => task.completed && task.completedAt && dateKey(new Date(task.completedAt)) === today);
    const overdue = tasks.filter(task => !task.completed && task.dueDate && task.dueDate < today);
    const pending = tasks.filter(task => !task.completed);
    const minutes = completedToday.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);

    return (
        <>
            <div className="grid grid-cols-3 gap-4">
                <Stat value={completedToday.length} label="Hechas hoy" color="var(--success)" />
                <Stat value={overdue.length} label="Vencidas" color={overdue.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'} />
                <Stat value={pending.length} label="Pendientes" color="var(--accent)" />
            </div>

            <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
                {completedToday.length === 0
                    ? 'Todavía no completaste nada hoy.'
                    : `Completaste ${completedToday.length} tarea${completedToday.length === 1 ? '' : 's'}${minutes > 0 ? ` (~${formatMinutes(minutes)})` : ''}.`}
                {overdue.length > 0
                    ? ` Quedan ${overdue.length} vencida${overdue.length === 1 ? '' : 's'} sin mover.`
                    : ' No arrastras vencidas.'}
            </p>

            {overdue.length > 0 && (
                <button onClick={onRescheduleOverdue}
                    className="mt-5 w-full h-10 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] text-[var(--on-accent)] text-[11px] font-semibold uppercase tracking-[0.08em]">
                    Pasar {overdue.length} vencida{overdue.length === 1 ? '' : 's'} a mañana
                </button>
            )}

            <button onClick={onOpenToday}
                className="mt-2 w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border)] text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-[var(--text)]">
                Ir a la vista Hoy
            </button>
        </>
    );
}
