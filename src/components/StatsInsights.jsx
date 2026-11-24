import { categories, formatMinutes, dateKey } from '../utils/helpers';

function dayKey(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : dateKey(date);
}

function calcActualMinutes(startedAt, completedAt) {
    if (!startedAt || !completedAt) return 0;
    return Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);
}

/** Días seguidos (hasta hoy) con al menos una tarea completada. */
function calcStreak(days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const cursor = new Date(today);
    // Si hoy todavía no hay nada completado, la racha puede seguir viva desde ayer.
    if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(dayKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

/** Mejor racha histórica a partir de los días con tareas completadas. */
function calcBestStreak(days) {
    const sorted = [...days].sort();
    let best = 0;
    let current = 0;
    let previous = null;
    for (const key of sorted) {
        const date = new Date(`${key}T00:00:00`);
        if (previous && Math.round((date - previous) / 86400000) === 1) current += 1;
        else current = 1;
        best = Math.max(best, current);
        previous = date;
    }
    return best;
}

function Section({ title, hint, children }) {
    return (
        <div className="mt-8">
            <h3 className="kicker mb-3">{title}</h3>
            <div className="border-t border-[var(--border)] pt-4">
                {children}
            </div>
            {hint && <p className="mt-3 text-[10.5px] leading-relaxed text-[var(--text-muted)] tracking-[0.02em]">{hint}</p>}
        </div>
    );
}

/** Estadísticas accionables: constancia, desvío real/estimado y dónde se atasca el trabajo. */
export default function StatsInsights({ tasks }) {
    const completedDays = new Set(
        tasks
            .filter(t => t.completed && t.completedAt)
            .map(t => dayKey(t.completedAt))
            .filter(Boolean)
    );
    const streak = calcStreak(completedDays);
    const bestStreak = calcBestStreak(completedDays);

    const withTime = tasks.filter(t => t.completed && t.startedAt && t.completedAt && (t.estimatedMinutes || 0) > 0);
    const byCategory = categories
        .map(cat => {
            const list = withTime.filter(t => (t.category || 'none') === cat.id);
            const estimated = list.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
            const actual = list.reduce((s, t) => s + calcActualMinutes(t.startedAt, t.completedAt), 0);
            return { id: cat.id, name: cat.name, color: cat.color, count: list.length, estimated, actual };
        })
        .filter(c => c.count > 0)
        .sort((a, b) => b.actual - a.actual);
    const maxDeviation = Math.max(...byCategory.map(c => Math.abs(c.actual - c.estimated)), 1);

    const today = new Date();
    const pending = tasks.filter(t => !t.completed);
    const stuck = categories
        .map(cat => {
            const list = pending.filter(t => (t.category || 'none') === cat.id);
            if (list.length === 0) return null;
            const ages = list.map(t => {
                const created = new Date(t.createdAt).getTime();
                if (!Number.isFinite(created)) return 0;
                return Math.max(0, Math.floor((today.getTime() - created) / 86400000));
            });
            const avgAge = Math.round(ages.reduce((s, a) => s + a, 0) / ages.length);
            const overdue = list.filter(t => t.dueDate && t.dueDate < dayKey(today)).length;
            return { id: cat.id, name: cat.name, color: cat.color, count: list.length, avgAge, overdue };
        })
        .filter(Boolean);

    const mostStuck = stuck
        .slice()
        .sort((a, b) => (b.overdue - a.overdue) || (b.avgAge - a.avgAge))[0];
    const stuckNeedsAttention = mostStuck && (mostStuck.overdue > 0 || mostStuck.avgAge >= 7);

    if (completedDays.size === 0 && byCategory.length === 0 && !stuckNeedsAttention) return null;

    return (
        <>
            {completedDays.size > 0 && (
                <Section title="Constancia"
                    hint={streak === 0
                        ? 'Aún no completas nada hoy. Una tarea pequeña mantiene viva la racha.'
                        : `Tu mejor racha registrada es de ${bestStreak} día${bestStreak === 1 ? '' : 's'}.`}>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="brand-type figure text-[26px] leading-none text-[var(--accent)]">{streak}</div>
                            <div className="mt-2 text-[9.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                Día{streak === 1 ? '' : 's'} seguidos
                            </div>
                        </div>
                        <div>
                            <div className="brand-type figure text-[26px] leading-none text-[var(--text-secondary)]">{bestStreak}</div>
                            <div className="mt-2 text-[9.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Mejor racha</div>
                        </div>
                    </div>
                </Section>
            )}

            {byCategory.length > 0 && (
                <Section title="Real vs estimado"
                    hint="La barra marca el desvío: a la derecha te pasaste del estimado, a la izquierda te sobró tiempo.">
                    {byCategory.map(c => {
                        const delta = c.actual - c.estimated;
                        const late = delta > 0;
                        const width = (Math.abs(delta) / maxDeviation) * 50;
                        return (
                            <div key={c.id} className="mb-3 last:mb-0">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <span className="text-[11.5px] text-[var(--text-secondary)] truncate">{c.name}</span>
                                    <span className="figure text-[10.5px] shrink-0" style={{ color: late ? 'var(--danger)' : 'var(--success)' }}>
                                        {late ? '+' : '−'}{formatMinutes(Math.abs(delta)) || '0min'}
                                    </span>
                                </div>
                                <div className="relative h-1 rounded-full bg-[var(--border)]">
                                    <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--border-strong)]" />
                                    <div className="absolute top-0 h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${width}%`,
                                            left: late ? '50%' : `${50 - width}%`,
                                            background: late ? 'var(--danger)' : 'var(--success)'
                                        }} />
                                </div>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    {formatMinutes(c.estimated)} estimado · {formatMinutes(c.actual)} real · {c.count} tarea{c.count === 1 ? '' : 's'}
                                </p>
                            </div>
                        );
                    })}
                </Section>
            )}

            {stuckNeedsAttention && (
                <Section title="Dónde se atasca"
                    hint={`${mostStuck.count} tarea${mostStuck.count === 1 ? '' : 's'} pendiente${mostStuck.count === 1 ? '' : 's'} en ${mostStuck.name}, con ${mostStuck.overdue > 0 ? `${mostStuck.overdue} vencida${mostStuck.overdue === 1 ? '' : 's'}` : `una antigüedad media de ${mostStuck.avgAge} días`}.`}>
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: mostStuck.color }} />
                        <span className="flex-1 text-[12.5px] text-[var(--text)]">{mostStuck.name}</span>
                        <span className="figure text-[11px] text-[var(--text-muted)]">
                            {mostStuck.overdue > 0 ? `${mostStuck.overdue} vencidas` : `${mostStuck.avgAge} días`}
                        </span>
                    </div>
                </Section>
            )}
        </>
    );
}
