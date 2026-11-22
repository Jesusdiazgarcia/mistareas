import { useState, useMemo } from 'react';
import { categories, priorities, formatDate, escapeHtml } from '../utils/helpers';

function KanbanCard({ task, onToggle }) {
    const category = categories.find(item => item.id === (task.category || 'none'));
    const priority = priorities.find(item => item.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);
    return (
        <div className="bg-[var(--card)] rounded-[var(--radius)] p-3 border border-[var(--border)] hover:border-[var(--border-strong)] active:scale-[0.98] transition-all duration-150"
            draggable data-id={task.id}>
            <div className="flex gap-2.5 items-start">
                <button onClick={(event) => { event.stopPropagation(); onToggle(task.id); }} aria-label="Alternar completada"
                    className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center shrink-0 mt-1 active:scale-90 transition-colors duration-150 ${task.completed ? 'bg-[var(--accent-fill)] border-[var(--accent-fill)]' : 'border-[var(--border-strong)] hover:border-[var(--accent)]'}`}>
                    {task.completed && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--on-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                    <div className={`text-[12.5px] leading-snug break-words ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>{escapeHtml(task.text)}</div>
                    <div className="meta-row mt-1.5 !text-[10.5px] !gap-2">
                        {task.inProgress && !task.completed && <span className="accent">En progreso</span>}
                        {category && category.id !== 'none' && <span>{category.name}</span>}
                        {priority && priority.id !== 'none' && <span className={priority.id === 'high' ? 'accent' : ''}>{priority.name}</span>}
                        {dateInfo && <span className={dateInfo.status === 'overdue' ? 'text-[var(--danger)]' : ''}>{dateInfo.label}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KanbanView({ tasks, onToggle, onMoveTask }) {
    const [draggedId, setDraggedId] = useState(null);
    const columns = useMemo(() => ({
        pending: tasks.filter(task => !task.completed && !task.inProgress),
        'in-progress': tasks.filter(task => !task.completed && task.inProgress),
        completed: tasks.filter(task => task.completed)
    }), [tasks]);

    const handleDragStart = (event) => { setDraggedId(Number(event.target.dataset.id)); event.target.classList.add('opacity-40'); event.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnd = (event) => { event.target.classList.remove('opacity-40'); };
    const handleDragOver = (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; };
    const handleDragEnter = (event) => { event.preventDefault(); event.currentTarget.classList.add('ring-1', 'ring-[var(--accent)]'); };
    const handleDragLeave = (event) => { event.currentTarget.classList.remove('ring-1', 'ring-[var(--accent)]'); };
    const handleDrop = (event, status) => { event.preventDefault(); event.currentTarget.classList.remove('ring-1', 'ring-[var(--accent)]'); if (draggedId) { onMoveTask(draggedId, status); setDraggedId(null); } };

    const colConfig = {
        pending: { title: 'Pendientes', accent: false },
        'in-progress': { title: 'En progreso', accent: true },
        completed: { title: 'Completadas', accent: false }
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {Object.entries(colConfig).map(([key, config]) => (
                <div key={key} data-status={key} onDragOver={handleDragOver} onDrop={event => handleDrop(event, key)} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                    className="flex-none w-[85vw] max-w-[300px] lg:w-auto lg:max-w-none lg:flex-1 bg-[var(--panel)]/40 rounded-[var(--radius-lg)] p-3 snap-start border border-[var(--border)] transition-all duration-150">
                    <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full ${config.accent ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)]'}`} />
                            <h3 className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{config.title}</h3>
                        </div>
                        <span className="folio">{String(columns[key].length).padStart(2, '0')}</span>
                    </div>
                    <div className="flex flex-col gap-2 min-h-[60px]">
                        {columns[key].length === 0 && (
                            <div className="text-center py-8 text-[11px] tracking-[0.04em] text-[var(--text-muted)]">Arrastra tareas aquí</div>
                        )}
                        {columns[key].map(task => (
                            <div key={task.id} draggable data-id={task.id} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <KanbanCard task={task} onToggle={onToggle} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
