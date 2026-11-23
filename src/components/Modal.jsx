import { useEffect, useRef } from 'react';

/**
 * Hoja/modal accesible: cierra con Esc, atrapa el foco mientras está abierto y
 * lo devuelve al elemento que lo abrió.
 */
export default function Modal({ show, title, onClose, onSave, mode, children }) {
    const panelRef = useRef(null);
    const previousFocus = useRef(null);
    const titleId = 'modal-title';

    useEffect(() => {
        if (!show) return undefined;

        previousFocus.current = document.activeElement;
        const panel = panelRef.current;
        const focusables = () => panel
            ? Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
                .filter(element => !element.hasAttribute('disabled'))
            : [];

        focusables()[0]?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            const items = focusables();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previousFocus.current?.focus?.();
        };
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-[fadeIn_0.2s_ease]" />
            <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
                className="relative bg-[var(--card)] w-full max-w-[480px] max-h-[85dvh] rounded-t-[var(--radius-lg)] border-t border-x border-[var(--border-strong)] flex flex-col animate-[slideUp_0.32s_cubic-bezier(0.32,0.72,0,1)] overflow-hidden"
                style={{ boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }}>
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-px bg-[var(--border-strong)]" />
                </div>
                <div className="flex justify-between items-center gap-4 px-5 pb-4">
                    <h2 id={titleId} className="brand-type text-[24px] leading-none text-[var(--text)]">{title}</h2>
                    <button onClick={onClose} aria-label="Cerrar"
                        className="w-8 h-8 rounded-[var(--radius-sm)] text-[var(--text-muted)] flex items-center justify-center active:scale-90 transition-colors duration-150 hover:text-[var(--text)] hover:bg-[var(--hover)]">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div className="px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </div>
                {!['history', 'stats', 'report'].includes(mode) && (
                    <div className="flex gap-2 px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)]">
                        <button onClick={onClose}
                            className="flex-1 h-11 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] tracking-[0.04em] active:scale-[0.99] transition-colors duration-150 hover:text-[var(--text)]">
                            Cancelar
                        </button>
                        <button onClick={onSave}
                            className="flex-1 h-11 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-[12px] font-semibold tracking-[0.04em] active:scale-[0.99] transition-colors duration-150">
                            Guardar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
