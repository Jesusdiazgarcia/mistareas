import { escapeHtml } from '../utils/helpers';

export default function History({ history }) {
    if (history.length === 0) return <p className="text-center py-8 text-[var(--text-muted)] text-base">No hay historial aún.</p>;
    return (
        <div className="flex flex-col">
            {history.slice(0, 50).map((h, i) => {
                const icon = h.type === 'completed' ? '✓' : h.type === 'deleted' ? '✕' : '+';
                const time = new Date(h.timestamp).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
                        <span className={`w-4 text-center text-[12px] shrink-0 ${h.type === 'completed' ? 'text-[var(--success)]' : h.type === 'deleted' ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>{icon}</span>
                        <span className="flex-1 text-[12.5px] text-[var(--text-secondary)] truncate min-w-0">{escapeHtml(h.text)}</span>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)] shrink-0">{time}</span>
                    </div>
                );
            })}
        </div>
    );
}
