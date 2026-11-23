/** Aviso visible cuando el navegador no puede guardar los cambios. */
export default function StorageWarning({ message, onDismiss, onExport }) {
    if (!message) return null;

    return (
        <div role="alert" aria-live="assertive"
            className="mb-4 rounded-[var(--radius)] border border-[var(--danger)] bg-[var(--accent-soft)] px-3.5 py-3">
            <p className="text-[12.5px] leading-snug text-[var(--text)]">{message}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
                <button onClick={onExport}
                    className="h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border-strong)]">
                    Descargar respaldo
                </button>
                <button onClick={onDismiss}
                    className="h-8 px-3 rounded-[var(--radius-sm)] text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--text)]">
                    Entendido
                </button>
            </div>
        </div>
    );
}
