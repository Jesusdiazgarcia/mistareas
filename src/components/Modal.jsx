export default function Modal({ show, title, onClose, onSave, mode, children }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-[fadeIn_0.2s_ease]" />
            <div className="relative bg-[var(--card)] w-full max-w-[480px] max-h-[85dvh] rounded-t-[28px] flex flex-col animate-[slideUp_0.35s_cubic-bezier(0.32,0.72,0,1)] overflow-hidden"
                style={{boxShadow: '0 -12px 40px rgba(0,0,0,0.15)'}}>
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
                </div>
                <div className="flex justify-between items-center px-5 pb-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-extrabold text-[var(--text)]">{title}</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--hover)] text-[var(--text-muted)] flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-[var(--border)]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </button>
                </div>
                <div className="px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] overflow-y-auto flex-1" style={{WebkitOverflowScrolling:'touch'}}>
                    {children}
                </div>
                {mode !== 'history' && mode !== 'stats' && (
                    <div className="flex gap-3 px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)]">
                        <button onClick={onClose} className="flex-1 h-12 rounded-[var(--radius)] bg-[var(--hover)] border border-[var(--border)] text-[var(--text-secondary)] font-bold text-sm active:scale-[0.98] transition-all duration-200">Cancelar</button>
                        <button onClick={onSave} className="flex-1 h-12 rounded-[var(--radius)] bg-gradient-to-r from-[#4c6ef5] to-[#7c3aed] text-white font-bold text-sm active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg">Guardar</button>
                    </div>
                )}
            </div>
        </div>
    );
}
