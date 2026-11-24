const ACTION = 'text-[10.5px] font-medium uppercase tracking-[0.1em] px-2.5 h-7 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]';

function daysLeft(deletedAt) {
    const deleted = new Date(deletedAt).getTime();
    if (!Number.isFinite(deleted)) return 0;
    const remaining = 7 - Math.floor((Date.now() - deleted) / 86400000);
    return Math.max(0, remaining);
}

/** Papelera: las tareas borradas se guardan 7 días y se pueden recuperar. */
export default function TrashView({ trash, onRestore, onDeleteForever, onEmptyTrash }) {
    if (!trash || trash.length === 0) {
        return (
            <div className="py-10 text-center">
                <p className="text-[13px] text-[var(--text-secondary)]">La papelera está vacía.</p>
                <p className="mt-1.5 text-[11.5px] text-[var(--text-muted)]">Lo que borres se guarda aquí durante 7 días.</p>
            </div>
        );
    }

    return (
        <div>
            <ul className="mb-4">
                {trash.map(entry => (
                    <li key={entry.task.id} className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
                        <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] leading-snug text-[var(--text-secondary)] break-words line-through">
                                {entry.task.text}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                                Quedan {daysLeft(entry.deletedAt)} día{daysLeft(entry.deletedAt) === 1 ? '' : 's'}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                            <button onClick={() => onRestore(entry.task.id)} className={ACTION}>Restaurar</button>
                            <button onClick={() => onDeleteForever(entry.task.id)}
                                className={ACTION + ' text-[var(--danger)] border-[var(--danger)]'}>
                                Borrar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={() => { if (window.confirm('¿Vaciar la papelera? Esto no se puede deshacer.')) onEmptyTrash(); }}
                className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--danger)] hover:border-[var(--danger)]">
                Vaciar papelera
            </button>
        </div>
    );
}
