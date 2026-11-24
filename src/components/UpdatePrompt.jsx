/** Aviso de versión nueva: el usuario decide cuándo actualizar. */
export default function UpdatePrompt({ show, onUpdate, onDismiss }) {
    if (!show) return null;

    return (
        <div role="status" aria-live="polite"
            className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-[1100] mx-auto flex max-w-[420px] items-center gap-3 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--card)] px-3.5 py-3"
            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            <p className="flex-1 text-[12px] leading-snug text-[var(--text-secondary)]">
                Hay una versión nueva de Mis Tareas.
            </p>
            <button onClick={onUpdate}
                className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                Actualizar
            </button>
            <button onClick={onDismiss} aria-label="Descartar aviso de actualización"
                className="w-8 h-8 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
        </div>
    );
}
