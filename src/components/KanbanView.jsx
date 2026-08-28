import { useState, useMemo } from 'react';
import { categories, priorities, formatDate, escapeHtml } from '../utils/helpers';

function KanbanCard({ task, onToggle }) {
    const cat = categories.find(c => c.id === (task.category || 'none'));
    const pri = priorities.find(p => p.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);
    return (
        <div className="bg-[var(--card)] rounded-[var(--radius)] p-3.5 border border-[var(--border)] active:scale-[0.97] transition-all duration-200"
            style={{boxShadow: 'var(--shadow-sm)'}} draggable data-id={task.id}>
            <div className="flex gap-2.5 items-start">
                <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 active:scale-90 transition-all duration-200 ${task.completed ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                    {task.completed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug break-words font-medium ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>{escapeHtml(task.text)}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {cat && cat.id !== 'none' && <span className="text-[10px] font-bold px-2 py-[3px] rounded-full text-white shadow-sm" style={{ background: cat.color }}>{cat.name}</span>}
                        {pri && pri.id !== 'none' && <span className="text-[10px] font-bold px-2 py-[3px] rounded-full text-white shadow-sm" style={{ background: pri.color }}>{pri.name}</span>}
                        {dateInfo && <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full text-white shadow-sm ${dateInfo.status === 'overdue' ? 'bg-[var(--danger)]' : dateInfo.status === 'today' ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'}`}>{dateInfo.label}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KanbanView({ tasks, onToggle, onMoveTask }) {
    const [draggedId, setDraggedId] = useState(null);
    const columns = useMemo(() => ({
        pending: tasks.filter(t => !t.completed && !t.inProgress),
        'in-progress': tasks.filter(t => !t.completed && t.inProgress),
        completed: tasks.filter(t => t.completed)
    }), [tasks]);

    const handleDragStart = (e) => { setDraggedId(Number(e.target.dataset.id)); e.target.classList.add('opacity-40'); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnd = (e) => { e.target.classList.remove('opacity-40'); };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDragEnter = (e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[var(--accent)]', 'ring-opacity-30'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('ring-2', 'ring-[var(--accent)]', 'ring-opacity-30'); };
    const handleDrop = (e, status) => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-[var(--accent)]', 'ring-opacity-30'); if (draggedId) { onMoveTask(draggedId, status); setDraggedId(null); } };

    const colConfig = {
        pending: { title: 'Pendientes', color: 'var(--text-muted)', bg: 'bg-[var(--hover)]' },
        'in-progress': { title: 'En Progreso', color: 'var(--warning)', bg: 'bg-[var(--warning-light)]' },
        completed: { title: 'Completadas', color: 'var(--success)', bg: 'bg-[var(--success-light)]' }
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
            {Object.entries(colConfig).map(([key, cfg]) => (
                <div key={key} data-status={key} onDragOver={handleDragOver} onDrop={e => handleDrop(e, key)} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                    className={`flex-none w-[85vw] max-w-[300px] ${cfg.bg} rounded-[var(--radius-xl)] p-3.5 snap-start border border-[var(--border)]`}>
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: cfg.color }} />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{cfg.title}</h3>
                        </div>
                        <span className="text-[11px] font-bold bg-[var(--card)] text-[var(--text-muted)] w-6 h-6 rounded-full flex items-center justify-center border border-[var(--border)]"
                            style={{boxShadow: 'var(--shadow-sm)'}}>{columns[key].length}</span>
                    </div>
                    <div className="flex flex-col gap-2 min-h-[60px]">
                        {columns[key].length === 0 && (
                            <div className="text-center py-8 text-xs text-[var(--text-muted)] font-medium">Arrastra tareas aquí</div>
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
