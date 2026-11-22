export default function EmptyState({ filter }) {
    const copy = {
        all: { title: 'Sin tareas', note: 'Agrega tu primera tarea arriba.' },
        pending: { title: 'Todo al día', note: 'No hay tareas pendientes.' },
        inprogress: { title: 'Nada en progreso', note: 'Marca una tarea para comenzar.' },
        completed: { title: 'Nada completado', note: 'Completa tus primeras tareas.' },
        recurring: { title: 'Sin recurrentes', note: 'Configura tareas con repetición.' }
    };
    const message = copy[filter] || copy.all;
    return (
        <div className="text-center py-20 px-6 animate-[fadeIn_0.3s_ease]">
            <div aria-hidden="true" className="mx-auto mb-5 h-px w-8 bg-[var(--border-strong)]" />
            <p className="brand-type text-[20px] text-[var(--text)]">{message.title}</p>
            <span className="mt-2 block text-[12px] tracking-[0.02em] text-[var(--text-muted)]">{message.note}</span>
        </div>
    );
}
