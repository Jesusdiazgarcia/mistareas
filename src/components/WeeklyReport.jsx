import { categories, formatDate, formatMinutes, escapeHtml } from '../utils/helpers';

function calcActualMinutes(startedAt, completedAt) {
    if (!startedAt || !completedAt) return 0;
    return Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);
}

export default function WeeklyReport({ tasks }) {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(t => t.completed && new Date(t.createdAt) >= weekAgo);
    const createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekAgo);
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate + 'T00:00:00') < now);
    const completedEst = completedThisWeek.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const catBreakdown = categories.map(cat => ({
        name: cat.name, color: cat.color,
        completed: completedThisWeek.filter(t => (t.category || 'none') === cat.id).length,
        created: createdThisWeek.filter(t => (t.category || 'none') === cat.id).length
    })).filter(c => c.completed > 0 || c.created > 0);
    const rate = createdThisWeek.length > 0 ? Math.round((completedThisWeek.length / createdThisWeek.length) * 100) : 0;
    const maxCat = Math.max(...catBreakdown.map(c => Math.max(c.completed, c.created)), 1);

    const tasksWithTime = completedThisWeek.filter(t => t.startedAt && t.completedAt);
    const totalActual = tasksWithTime.reduce((s, t) => s + calcActualMinutes(t.startedAt, t.completedAt), 0);
    const avgAccuracy = tasksWithTime.length > 0 ? Math.round((tasksWithTime.filter(t => {
        const actual = calcActualMinutes(t.startedAt, t.completedAt);
        return t.estimatedMinutes > 0 && actual <= t.estimatedMinutes * 1.2;
    }).length / tasksWithTime.length) * 100) : 0;

    return (
        <>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border-t border-[var(--border)] pt-3">
                    <div className="brand-type figure text-[24px] leading-none text-[var(--success)]">{completedThisWeek.length}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] mt-1.5">Completadas</div>
                </div>
                <div className="border-t border-[var(--border)] pt-3">
                    <div className="brand-type figure text-[24px] leading-none text-[var(--accent)]">{createdThisWeek.length}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] mt-1.5">Creadas</div>
                </div>
                <div className="border-t border-[var(--border)] pt-3">
                    <div className="brand-type figure text-[24px] leading-none" style={{color: overdue.length > 0 ? 'var(--danger)' : 'var(--success)'}}>{overdue.length}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] mt-1.5">Vencidas</div>
                </div>
            </div>
            <div className="border-t border-[var(--border)] pt-4 mb-6">
                <div className="kicker mb-3">Tasa de completado</div>
                <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent-fill)] rounded-full transition-all duration-500" style={{ width: `${rate}%` }} /></div>
                <div className="brand-type figure text-[26px] text-[var(--accent)] mt-2">{rate}%</div>
            </div>

            {tasksWithTime.length > 0 && (
                <div className="border-t border-[var(--border)] pt-4 mb-6">
                    <div className="kicker mb-3">Tiempo esta semana</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="brand-type figure text-[18px] text-[var(--accent)]">{formatMinutes(completedEst)}</div>
                            <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">Estimado</div>
                        </div>
                        <div>
                            <div className="brand-type figure text-[18px] text-[var(--success)]">{formatMinutes(totalActual)}</div>
                            <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">Real</div>
                        </div>
                        <div>
                            <div className="brand-type figure text-[18px]" style={{color: avgAccuracy >= 80 ? 'var(--success)' : 'var(--warning)'}}>{avgAccuracy}%</div>
                            <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-1">Precisión</div>
                        </div>
                    </div>
                </div>
            )}

            {catBreakdown.length > 0 && (
                <div className="mt-4">
                    <h3 className="kicker mb-3">Por categoría · esta semana</h3>
                    {catBreakdown.map(c => (
                        <div key={c.name} className="flex items-center gap-2.5 mb-2.5">
                            <span className="text-[11px] text-[var(--text-muted)] w-16 text-right shrink-0 truncate">{c.name}</span>
                            <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.completed / maxCat) * 100}%`, background: c.color }} /></div>
                            <span className="figure text-[11px] w-10 shrink-0 text-[var(--text-secondary)]">{c.completed}/{c.created}</span>
                        </div>
                    ))}
                </div>
            )}
            {overdue.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[9.5px] uppercase tracking-[0.16em] text-[var(--danger)] mb-3">Tareas vencidas</h3>
                    {overdue.slice(0, 5).map(t => {
                        const di = formatDate(t.dueDate);
                        return (
                            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
                                <span className="flex-1 text-[12.5px] truncate text-[var(--text-secondary)]">{escapeHtml(t.text)}</span>
                                <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--danger)] shrink-0">{di?.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
