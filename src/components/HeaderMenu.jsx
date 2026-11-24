const ITEMS = [
    { key: 'report', label: 'Reporte semanal' },
    { key: 'stats', label: 'Estadísticas' },
    { key: 'history', label: 'Historial' },
    { key: 'review', label: 'Cierre del día' },
    { key: 'trash', label: 'Papelera' }
];

/** Acciones del menú de la cabecera. */
export default function HeaderMenu({ onReport, onStats, onHistory, onTrash, onReview }) {
    const handlers = { report: onReport, stats: onStats, history: onHistory, trash: onTrash, review: onReview };

    return (
        <div className="p-1">
            {ITEMS.map(item => (
                <button key={item.key} onClick={handlers[item.key]} role="menuitem"
                    className="w-full px-3 py-2 text-left text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[var(--radius-sm)] transition-colors duration-150">
                    {item.label}
                </button>
            ))}
        </div>
    );
}
