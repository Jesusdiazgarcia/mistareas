import { escapeHtml } from '../utils/helpers';

export default function History({ history }) {
    if (history.length === 0) return <p className="text-center py-8 text-[var(--text-muted)] text-base">No hay historial aún.</p>;
    return (
        <div className="flex flex-col gap-2">
            {history.slice(0, 50).map((h, i) => {
                const icon = h.type === 'completed' ? '✓' : h.type === 'deleted' ? '✕' : '+';
                const time = new Date(h.timestamp).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                    <div key={i} className="flex items-center gap-2.5 p-3 bg-[var(--hover)] rounded-[14px]">
                        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-sm shrink-0 font-bold ${h.type === 'completed' ? 'bg-[var(--success-light)] text-[var(--success)]' : h.type === 'deleted' ? 'bg-[var(--danger-light)] text-[var(--danger)]' : 'bg-[var(--accent-light)] text-[var(--accent)]'}`}>{icon}</div>
                        <span className="flex-1 text-sm text-[var(--text)] truncate min-w-0 font-medium">{escapeHtml(h.text)}</span>
                        <span className="text-[11px] text-[var(--text-muted)] shrink-0">{time}</span>
                    </div>
                );
            })}
        </div>
    );
}
