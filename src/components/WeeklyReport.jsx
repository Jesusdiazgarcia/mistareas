import { categories, formatDate, formatMinutes, escapeHtml } from '../utils/helpers';

export default function WeeklyReport({ tasks }) {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(t => t.completed && new Date(t.createdAt) >= weekAgo);
    const createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekAgo);
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now);
    const totalEst = createdThisWeek.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const completedEst = completedThisWeek.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const catBreakdown = categories.map(cat => ({
        name: cat.name, color: cat.color,
        completed: completedThisWeek.filter(t => (t.category || 'none') === cat.id).length,
        created: createdThisWeek.filter(t => (t.category || 'none') === cat.id).length
    })).filter(c => c.completed > 0 || c.created > 0);
    const rate = createdThisWeek.length > 0 ? Math.round((completedThisWeek.length / createdThisWeek.length) * 100) : 0;
    const maxCat = Math.max(...catBreakdown.map(c => Math.max(c.completed, c.created)), 1);

    return (
        <>
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[var(--hover)] rounded-[var(--radius)] p-3.5 text-center border border-[var(--border)]">
                    <div className="text-[22px] font-extrabold text-[var(--success)]">{completedThisWeek.length}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">Completadas</div>
                </div>
                <div className="bg-[var(--hover)] rounded-[var(--radius)] p-3.5 text-center border border-[var(--border)]">
                    <div className="text-[22px] font-extrabold text-[var(--accent)]">{createdThisWeek.length}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">Creadas</div>
                </div>
                <div className="bg-[var(--hover)] rounded-[var(--radius)] p-3.5 text-center border border-[var(--border)]">
                    <div className="text-[22px] font-extrabold" style={{color: overdue.length > 0 ? 'var(--danger)' : 'var(--success)'}}>{overdue.length}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">Vencidas</div>
                </div>
            </div>
            <div className="bg-[var(--hover)] rounded-[var(--radius)] p-4 mb-4 border border-[var(--border)]">
                <div className="text-sm text-[var(--text-muted)] font-bold mb-2">Tasa de completado</div>
                <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#4c6ef5] to-[#7c3aed] rounded-full transition-all duration-500" style={{ width: `${rate}%` }} /></div>
                <div className="text-[24px] font-extrabold text-[var(--accent)] mt-2">{rate}%</div>
            </div>
            {totalEst > 0 && (
                <div className="bg-[var(--hover)] rounded-[var(--radius)] p-4 mb-4 border border-[var(--border)]">
                    <div className="text-sm text-[var(--text-muted)] font-bold mb-2">Tiempo estimado vs completado</div>
                    <div className="flex gap-6 mt-2">
                        <div className="flex flex-col items-center"><span className="text-base font-bold">{formatMinutes(totalEst)}</span><span className="text-[11px] text-[var(--text-muted)]">Estimado</span></div>
                        <div className="flex flex-col items-center"><span className="text-base font-bold">{formatMinutes(completedEst)}</span><span className="text-[11px] text-[var(--text-muted)]">Completado</span></div>
                    </div>
                </div>
            )}
            {catBreakdown.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[14px] font-bold text-[var(--text)] mb-3">Por Categoría (esta semana)</h3>
                    {catBreakdown.map(c => (
                        <div key={c.name} className="flex items-center gap-2.5 mb-2.5">
                            <span className="text-xs text-[var(--text-muted)] w-16 text-right shrink-0 truncate font-semibold">{c.name}</span>
                            <div className="flex-1 h-3 bg-[var(--hover)] rounded-full overflow-hidden border border-[var(--border)]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.completed / maxCat) * 100}%`, background: c.color }} /></div>
                            <span className="text-xs font-bold w-10 shrink-0">{c.completed}/{c.created}</span>
                        </div>
                    ))}
                </div>
            )}
            {overdue.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[14px] font-bold text-[var(--danger)] mb-2">Tareas vencidas</h3>
                    {overdue.slice(0, 5).map(t => {
                        const di = formatDate(t.dueDate);
                        return (
                            <div key={t.id} className="flex items-center gap-2.5 p-3 bg-[var(--hover)] rounded-[14px] mb-2 border border-[var(--border)]">
                                <span className="flex-1 text-sm truncate font-medium">{escapeHtml(t.text)}</span>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-[10px] bg-[var(--danger)] text-white shrink-0 shadow-sm">{di?.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
