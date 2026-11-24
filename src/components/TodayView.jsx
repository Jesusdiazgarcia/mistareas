import { categories, priorities, formatDate, dateKey } from '../utils/helpers';

function TaskRow({ task, onToggle, onSnooze }) {
    const category = categories.find(item => item.id === (task.category || 'none'));
    const priority = priorities.find(item => item.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);

    return (
        <li className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
            <button onClick={() => onToggle(task.id)} role="checkbox" aria-checked={task.completed}
                aria-label={`Marcar "${task.text}" como completada`}
                className="relative after:absolute after:-inset-3 after:content-[''] w-[16px] h-[16px] rounded-full border border-[var(--border-strong)] shrink-0 mt-[3px] hover:border-[var(--accent)] active:scale-90 transition-colors duration-150" />
            <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug text-[var(--text)] break-words">{task.text}</p>
                <div className="meta-row mt-1">
                    {task.inProgress && <span className="accent">En progreso</span>}
                    {category && category.id !== 'none' && <span>{category.name}</span>}
                    {priority && priority.id !== 'none' && <span className={priority.id === 'high' ? 'accent' : ''}>{priority.name}</span>}
                    {dateInfo && <span className={dateInfo.status === 'overdue' ? 'text-[var(--danger)]' : ''}>{dateInfo.label}</span>}
                    {task.dueTime && <span className="figure">{task.dueTime}</span>}
                </div>
            </div>
            {onSnooze && (
                <button onClick={() => onSnooze(task.id, 1)} aria-label={`Pasar "${task.text}" a mañana`}
                    className="shrink-0 h-6 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]">
                    Mañana
                </button>
            )}
        </li>
    );
}

function Section({ title, tasks, onToggle, onSnooze, empty }) {
    return (
        <section className="mb-7 last:mb-0">
            <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-2 mb-1">
                <h2 className="kicker">{title}</h2>
                <span className="figure text-[11px] text-[var(--text-muted)]">{tasks.length}</span>
            </div>
            {tasks.length === 0
                ? <p className="py-3 text-[11.5px] text-[var(--text-muted)]">{empty}</p>
                : <ul>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} onSnooze={onSnooze} />)}</ul>}
        </section>
    );
}

/** Agenda del día: vencidas, para hoy y en progreso, sin filtrar a mano. */
export default function TodayView({ tasks, onToggle, onSetDueDate, onSnooze }) {
    const today = dateKey();
    const pending = tasks.filter(task => !task.completed);

    const overdue = pending.filter(task => task.dueDate && task.dueDate < today);
    const dueToday = pending.filter(task => task.dueDate === today);
    const inProgress = pending.filter(task => task.inProgress);
    const nothing = overdue.length === 0 && dueToday.length === 0 && inProgress.length === 0;

    if (nothing) {
        return (
            <div className="py-10 text-center">
                <p className="text-[13px] text-[var(--text-secondary)]">Nada urgente por hoy.</p>
                <p className="mt-1.5 text-[11.5px] text-[var(--text-muted)]">Sin vencidas, sin tareas para hoy y sin nada en progreso.</p>
                {onSetDueDate && (
                    <button onClick={onSetDueDate}
                        className="mt-4 h-9 px-3.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]">
                        Ver todas las tareas
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="pb-4">
            <Section title="Vencidas" tasks={overdue} onToggle={onToggle} onSnooze={onSnooze} empty="Ninguna vencida. Bien." />
            <Section title="Para hoy" tasks={dueToday} onToggle={onToggle} onSnooze={onSnooze} empty="Nada con fecha de hoy." />
            <Section title="En progreso" tasks={inProgress} onToggle={onToggle} onSnooze={onSnooze} empty="Nada empezado." />
        </div>
    );
}
