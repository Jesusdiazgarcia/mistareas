import { useReminders } from '../hooks/useReminders';

/** Aviso de una tarea cuya hora ya pasó. Vive en la columna para no tapar controles. */
export default function ReminderBanner({ tasks, onOpen }) {
    const { reminders, dismiss, permission, enableNotifications } = useReminders(tasks);
    if (reminders.length === 0) return null;

    const current = reminders[0];
    const extra = reminders.length - 1;

    return (
        <div role="status" aria-live="polite"
            className="mb-4 rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--card)] px-3.5 py-3">
            <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 text-[13px] text-[var(--accent)]">⏰</span>
                <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] leading-snug text-[var(--text)] break-words">{current.text}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        Era para las {current.dueTime}{extra > 0 ? ` · y ${extra} más` : ''}
                    </p>
                </div>
                <button onClick={() => dismiss(current.key)} aria-label="Descartar recordatorio"
                    className="w-7 h-7 shrink-0 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
                <button onClick={() => { dismiss(current.key); onOpen(current.id); }}
                    className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] text-[var(--on-accent)] text-[10px] font-semibold uppercase tracking-[0.1em]">
                    Ver tarea
                </button>
                <button onClick={() => dismiss(current.key)}
                    className="h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)]">
                    Entendido
                </button>
                {permission === 'default' && (
                    <button onClick={enableNotifications}
                        className="ml-auto text-[10.5px] text-[var(--text-muted)] underline hover:text-[var(--text)]">
                        Activar avisos
                    </button>
                )}
            </div>
        </div>
    );
}
