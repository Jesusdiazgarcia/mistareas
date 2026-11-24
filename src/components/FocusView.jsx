import { categories, priorities, formatDate, priorityOrder, FOCUS_LIMIT } from '../utils/helpers';

function metaFor(task) {
    const category = categories.find(item => item.id === (task.category || 'none'));
    const priority = priorities.find(item => item.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);
    return { category, priority, dateInfo };
}

function FocusRow({ task, onToggle, onRemove }) {
    const { category, priority, dateInfo } = metaFor(task);
    return (
        <li className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-b-0">
            <button onClick={() => onToggle(task.id)} role="checkbox" aria-checked={task.completed}
                aria-label={task.completed ? `Marcar "${task.text}" como pendiente` : `Marcar "${task.text}" como completada`}
                className={`relative after:absolute after:-inset-3 after:content-[''] w-[17px] h-[17px] rounded-full border flex items-center justify-center shrink-0 mt-[3px] active:scale-90 transition-all duration-150 ${task.completed ? 'bg-[var(--accent-fill)] border-[var(--accent-fill)]' : 'border-[var(--border-strong)] hover:border-[var(--accent)]'}`}>
                {task.completed && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M3 6l2.5 2.5L9 4" stroke="var(--on-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-snug break-words ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>{task.text}</p>
                <div className="meta-row mt-1">
                    {category && category.id !== 'none' && <span>{category.name}</span>}
                    {priority && priority.id !== 'none' && <span className={priority.id === 'high' ? 'accent' : ''}>{priority.name}</span>}
                    {dateInfo && <span className={dateInfo.status === 'overdue' ? 'text-[var(--danger)]' : ''}>{dateInfo.label}</span>}
                    {task.dueTime && <span className="figure">{task.dueTime}</span>}
                </div>
            </div>
            <button onClick={() => onRemove(task.id)} aria-label={`Quitar "${task.text}" de Mi día`}
                className="shrink-0 w-6 h-6 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
        </li>
    );
}

/** "Mi día": hasta tres tareas foco para medir el día contra ellas. */
export default function FocusView({ tasks, focusIds, onToggle, onToggleFocus, onClear, onGoList }) {
    const byId = new Map(tasks.map(task => [task.id, task]));
    const focusTasks = focusIds.map(id => byId.get(id)).filter(Boolean);
    const done = focusTasks.filter(task => task.completed).length;
    const full = focusIds.length >= FOCUS_LIMIT;

    const suggestions = tasks
        .filter(task => !task.completed && !focusIds.includes(task.id))
        .slice()
        .sort((a, b) => {
            const byPriority = priorityOrder[b.priority || 'none'] - priorityOrder[a.priority || 'none'];
            if (byPriority !== 0) return byPriority;
            return String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'));
        })
        .slice(0, 6);

    return (
        <div className="pb-4">
            <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-2 mb-1">
                <h2 className="kicker">Mi día</h2>
                <span className="figure text-[11px] text-[var(--text-muted)]">
                    {done}/{focusIds.length || FOCUS_LIMIT}
                </span>
            </div>
            <p className="mb-3 text-[11.5px] text-[var(--text-muted)]">
                Hasta {FOCUS_LIMIT} tareas para hoy. Lo demás puede esperar.
            </p>

            {focusTasks.length === 0 ? (
                <p className="py-4 text-[12.5px] text-[var(--text-secondary)]">Aún no elegiste nada para hoy.</p>
            ) : (
                <ul>{focusTasks.map(task => (
                    <FocusRow key={task.id} task={task} onToggle={onToggle} onRemove={onToggleFocus} />
                ))}</ul>
            )}

            {focusTasks.length > 0 && (
                <div className="mt-2 flex items-center justify-between">
                    <button onClick={onClear} className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)]">
                        Vaciar mi día
                    </button>
                    {full && <span className="text-[10.5px] text-[var(--text-muted)]">Quita una para añadir otra</span>}
                </div>
            )}

            {!full && suggestions.length > 0 && (
                <section className="mt-7">
                    <h3 className="kicker mb-2">Para elegir</h3>
                    <ul>
                        {suggestions.map(task => {
                            const { category, dateInfo } = metaFor(task);
                            return (
                                <li key={task.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
                                    <span className="flex-1 min-w-0 truncate text-[12.5px] text-[var(--text-secondary)]">{task.text}</span>
                                    {dateInfo && <span className={`shrink-0 text-[10px] uppercase tracking-[0.06em] ${dateInfo.status === 'overdue' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                                        {dateInfo.label}
                                    </span>}
                                    {category && category.id !== 'none' && <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{category.name}</span>}
                                    <button onClick={() => onToggleFocus(task.id)} aria-label={`Añadir "${task.text}" a Mi día`}
                                        className="shrink-0 h-7 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]">
                                        Añadir
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            <button onClick={onGoList}
                className="mt-6 h-9 px-3.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]">
                Ver todas las tareas
            </button>
        </div>
    );
}
