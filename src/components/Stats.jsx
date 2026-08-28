import { categories, priorities, formatMinutes } from '../utils/helpers';

function calcActualMinutes(startedAt, completedAt) {
    if (!startedAt || !completedAt) return 0;
    return Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);
}

export default function Stats({ tasks }) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const recurring = tasks.filter(t => t.repeat && t.repeat !== 'none').length;
    const categoryStats = categories.map(cat => ({ name: cat.name, color: cat.color, count: tasks.filter(t => (t.category || 'none') === cat.id).length })).filter(c => c.count > 0);
    const priorityStats = priorities.map(pri => ({ name: pri.name, color: pri.color, count: tasks.filter(t => (t.priority || 'none') === pri.id).length })).filter(p => p.count > 0);
    const maxCat = Math.max(...categoryStats.map(c => c.count), 1);
    const maxPri = Math.max(...priorityStats.map(p => p.count), 1);

    const tasksWithTime = tasks.filter(t => t.completed && t.startedAt && t.completedAt);
    const totalEstimated = tasksWithTime.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const totalActual = tasksWithTime.reduce((s, t) => s + calcActualMinutes(t.startedAt, t.completedAt), 0);
    const avgAccuracy = tasksWithTime.length > 0 ? Math.round((tasksWithTime.filter(t => {
        const actual = calcActualMinutes(t.startedAt, t.completedAt);
        return t.estimatedMinutes > 0 && actual <= t.estimatedMinutes * 1.2;
    }).length / tasksWithTime.length) * 100) : 0;

    return (
        <>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                    { v: total, l: 'Total', c: 'var(--accent)' },
                    { v: completed, l: 'Completadas', c: 'var(--success)' },
                    { v: pending, l: 'Pendientes', c: 'var(--warning)' },
                    { v: recurring, l: 'Recurrentes', c: 'var(--accent)' }
                ].map(s => (
                    <div key={s.l} className="bg-[var(--hover)] rounded-[var(--radius)] p-4 text-center border border-[var(--border)]">
                        <div className="text-[26px] font-extrabold leading-none" style={{color: s.c}}>{s.v}</div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-2 font-bold">{s.l}</div>
                    </div>
                ))}
            </div>

            {tasksWithTime.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[14px] font-bold text-[var(--text)] mb-3">Tiempo estimado vs real</h3>
                    <div className="bg-[var(--hover)] rounded-[var(--radius)] p-4 border border-[var(--border)]">
                        <div className="grid grid-cols-3 gap-3 text-center mb-3">
                            <div>
                                <div className="text-[18px] font-extrabold text-[var(--accent)]">{formatMinutes(totalEstimated)}</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Estimado</div>
                            </div>
                            <div>
                                <div className="text-[18px] font-extrabold text-[var(--success)]">{formatMinutes(totalActual)}</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Real</div>
                            </div>
                            <div>
                                <div className="text-[18px] font-extrabold" style={{color: avgAccuracy >= 80 ? 'var(--success)' : avgAccuracy >= 50 ? 'var(--warning)' : 'var(--danger)'}}>{avgAccuracy}%</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Precisión</div>
                            </div>
                        </div>
                        {totalEstimated > 0 && (
                            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{
                                    width: `${Math.min((totalActual / totalEstimated) * 100, 100)}%`,
                                    background: totalActual <= totalEstimated ? 'var(--success)' : 'var(--danger)'
                                }} />
                            </div>
                        )}
                        <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center">
                            {tasksWithTime.length} tarea{tasksWithTime.length !== 1 ? 's' : ''} con tiempo registrado
                        </p>
                    </div>
                </div>
            )}

            {categoryStats.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[14px] font-bold text-[var(--text)] mb-3">Por Categoría</h3>
                    {categoryStats.map(c => (
                        <div key={c.name} className="flex items-center gap-2.5 mb-2.5">
                            <span className="text-xs text-[var(--text-muted)] w-16 text-right shrink-0 truncate font-semibold">{c.name}</span>
                            <div className="flex-1 h-3 bg-[var(--hover)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color }} />
                            </div>
                            <span className="text-xs font-bold w-8 shrink-0">{c.count}</span>
                        </div>
                    ))}
                </div>
            )}
            {priorityStats.length > 0 && (
                <div className="mt-5">
                    <h3 className="text-[14px] font-bold text-[var(--text)] mb-3">Por Prioridad</h3>
                    {priorityStats.map(p => (
                        <div key={p.name} className="flex items-center gap-2.5 mb-2.5">
                            <span className="text-xs text-[var(--text-muted)] w-16 text-right shrink-0 truncate font-semibold">{p.name}</span>
                            <div className="flex-1 h-3 bg-[var(--hover)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.count / maxPri) * 100}%`, background: p.color }} />
                            </div>
                            <span className="text-xs font-bold w-8 shrink-0">{p.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
