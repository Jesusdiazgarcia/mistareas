export default function EmptyState({ filter }) {
    const m = {
        all: { i: '📝', t: 'Sin tareas', s: 'Agrega tu primera tarea arriba' },
        pending: { i: '✨', t: 'Todo al día', s: 'No hay tareas pendientes' },
        inprogress: { i: '🚀', t: 'Nada en progreso', s: 'Marca una tarea para comenzar' },
        completed: { i: '🎯', t: 'Nada completado', s: '¡Completa tus primeras tareas!' },
        recurring: { i: '🔄', t: 'Sin recurrentes', s: 'Configura tareas con repetición' }
    };
    const msg = m[filter] || m.all;
    return (
        <div className="text-center py-16 px-6 animate-[fadeIn_0.3s_ease]">
            <div className="w-24 h-24 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--hover)] to-[var(--accent-light)] flex items-center justify-center mx-auto mb-5 shadow-sm">
                <span className="text-4xl">{msg.i}</span>
            </div>
            <p className="text-base font-bold text-[var(--text)] mb-2">{msg.t}</p>
            <span className="text-sm text-[var(--text-muted)] leading-relaxed">{msg.s}</span>
        </div>
    );
}
