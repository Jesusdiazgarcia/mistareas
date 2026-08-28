import { useState, useRef } from 'react';
import { categories, priorities, repeats, formatDate, formatMinutes } from '../utils/helpers';
import { parseMarkdown } from '../utils/markdown';
import { generateTaskICS, downloadICS } from '../utils/calendarExport';

function calcActualMinutes(startedAt, completedAt) {
    if (!startedAt || !completedAt) return 0;
    return Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);
}

export default function TaskItem({ task, selected, onToggle, onDelete, onTogglePin, onToggleSubtask, onAddSubtask, onToggleSelect, onEdit, collapsed, onToggleCollapse, onSaveNotes, onToggleInProgress, onDragStart, onDragEnd, onDragOver, onDrop }) {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [showNotes, setShowNotes] = useState(false);
    const [notesText, setNotesText] = useState(task.notes || '');
    const [subtaskInput, setSubtaskInput] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const editRef = useRef(null);

    const category = categories.find(c => c.id === (task.category || 'none'));
    const priority = priorities.find(p => p.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    const handleDoubleClick = () => {
        setEditing(true); setEditText(task.text);
        setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 0);
    };
    const saveEdit = () => {
        const trimmed = editText.trim();
        if (trimmed && trimmed !== task.text) onEdit(task.id, trimmed, task.text);
        setEditing(false);
    };
    const handleNotesBlur = () => { if (notesText !== (task.notes || '')) onSaveNotes(task.id, notesText); };
    const handleAddSubtask = () => {
        if (subtaskInput.trim()) { onAddSubtask(task.id, subtaskInput.trim()); setSubtaskInput(''); }
    };
    const handleAddToCalendar = () => {
        const ics = generateTaskICS(task);
        const safeName = task.text.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_').substring(0, 30);
        downloadICS(`${safeName}.ics`, ics);
        setShowActions(false);
    };

    const borderColor = task.pinned ? '#f59e0b' : (category && category.id !== 'none' ? category.color : 'transparent');
    const actualMinutes = calcActualMinutes(task.startedAt, task.completedAt);

    return (
        <li className={`group relative flex items-start gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] mb-2.5 transition-all duration-200 ${selected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : ''} ${task.completed ? 'opacity-55' : ''} ${showSubtaskInput ? 'ring-1 ring-[var(--accent)]' : ''}`}
            style={{
                borderLeftWidth: '4px',
                borderLeftColor: borderColor,
                boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}
            draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}>

            <button onClick={() => onToggle(task.id)} aria-checked={task.completed} role="checkbox"
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-[3px] active:scale-[0.85] transition-all duration-200 ${task.completed ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]'}`}>
                {task.completed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2.5 2.5L9 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <input ref={editRef} value={editText} onChange={e => setEditText(e.target.value)} onBlur={saveEdit} maxLength={500}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditText(task.text); setEditing(false); } }}
                        className="w-full px-3 py-2 rounded-[14px] border-2 border-[var(--accent)] bg-[var(--card)] text-[var(--text)] text-[15px] outline-none transition-all duration-200"
                        style={{boxShadow: '0 0 0 3px var(--accent-light)'}} />
                ) : (
                    <span onDoubleClick={handleDoubleClick} title="Doble clic para editar"
                        className={`block text-[15px] leading-[1.5] break-words cursor-default select-text ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)] font-medium'}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(task.text) }} />
                )}

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {task.inProgress && !task.completed && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-[3px] rounded-full bg-[var(--warning-light)] text-[var(--warning)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-[pulse_2s_ease-in-out_infinite]" />
                            En progreso
                        </span>
                    )}
                    {category && category.id !== 'none' && (
                        <span className="text-[10px] font-bold px-2.5 py-[3px] rounded-full text-white shadow-sm" style={{ background: category.color }}>{category.name}</span>
                    )}
                    {priority && priority.id !== 'none' && (
                        <span className="text-[10px] font-bold px-2.5 py-[3px] rounded-full text-white shadow-sm" style={{ background: priority.color }}>{priority.name}</span>
                    )}
                    {task.repeat && task.repeat !== 'none' && (
                        <span className="text-[10px] font-bold px-2.5 py-[3px] rounded-full bg-[var(--accent-light)] text-[var(--accent)]">{repeats[task.repeat]}</span>
                    )}
                    {dateInfo && (
                        <span className={`text-[10px] font-bold px-2.5 py-[3px] rounded-full text-white shadow-sm ${dateInfo.status === 'overdue' ? 'bg-[var(--danger)]' : dateInfo.status === 'today' || dateInfo.status === 'tomorrow' ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'}`}>{dateInfo.label}</span>
                    )}
                    {task.estimatedMinutes > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-[3px] rounded-full bg-[var(--accent-light)] text-[var(--accent)]">{formatMinutes(task.estimatedMinutes)}</span>
                    )}
                    {task.completed && actualMinutes > 0 && task.estimatedMinutes > 0 && (
                        <span className={`text-[10px] font-bold px-2.5 py-[3px] rounded-full ${actualMinutes <= task.estimatedMinutes ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--danger-light)] text-[var(--danger)]'}`}>
                            {actualMinutes <= task.estimatedMinutes ? '✓' : '✗'} {formatMinutes(actualMinutes)} real
                        </span>
                    )}
                    {task.completed && actualMinutes > 0 && !task.estimatedMinutes && (
                        <span className="text-[10px] font-bold px-2.5 py-[3px] rounded-full bg-[var(--success-light)] text-[var(--success)]">⏱ {formatMinutes(actualMinutes)} real</span>
                    )}
                </div>

                {task.notes && task.notes.trim() && !showNotes && !editing && (
                    <button onClick={() => setShowNotes(true)}
                        className="text-[13px] text-[var(--text-muted)] mt-2.5 p-3 bg-[var(--hover)] rounded-[14px] text-left w-full leading-snug line-clamp-2 border-l-[3px] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all duration-200">
                        {task.notes.length > 50 ? task.notes.substring(0, 50) + '...' : task.notes}
                    </button>
                )}
                {showNotes && (
                    <div className="mt-2.5">
                        <textarea value={notesText} onChange={e => setNotesText(e.target.value)} onBlur={handleNotesBlur} placeholder="Notas..."
                            onKeyDown={e => { if (e.key === 'Escape') { handleNotesBlur(); setShowNotes(false); } }}
                            className="w-full p-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] resize-y min-h-[60px] transition-all duration-200" />
                    </div>
                )}

                {hasSubtasks && !editing && (
                    <button onClick={() => onToggleCollapse(task.id)}
                        className="flex items-center gap-1.5 mt-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 py-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="font-semibold">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtareas</span>
                    </button>
                )}

                {hasSubtasks && !collapsed && !editing && (
                    <div className="mt-2.5 pl-3.5 border-l-2 border-[var(--border)] space-y-1.5">
                        {task.subtasks.map((sub, i) => (
                            <div key={i} className="flex items-center gap-2.5 py-1">
                                <button onClick={() => onToggleSubtask(task.id, i)}
                                    className={`w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center shrink-0 active:scale-90 transition-all duration-200 ${sub.completed ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                                    {sub.completed && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </button>
                                <span className={`text-[13px] flex-1 ${sub.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>{sub.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {showSubtaskInput && !editing && (
                    <div className="flex gap-2 mt-2.5">
                        <input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} placeholder="Subtarea..." autoFocus
                            onKeyDown={e => { if (e.key === 'Enter' && subtaskInput.trim()) handleAddSubtask(); if (e.key === 'Escape') { setShowSubtaskInput(false); setSubtaskInput(''); } }}
                            onBlur={() => { if (!subtaskInput.trim()) setShowSubtaskInput(false); }}
                            className="flex-1 px-3 py-2 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-200" />
                        <button onClick={handleAddSubtask} className="px-3 py-2 rounded-[14px] bg-[var(--accent)] text-white text-sm font-bold active:scale-95 transition-all duration-200 shadow-sm">OK</button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => onToggleSelect(task.id)} aria-label="Seleccionar"
                    className={`w-7 h-7 rounded-[10px] flex items-center justify-center transition-all duration-200 ${selected ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--hover)]'}`}>
                    {selected
                        ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>}
                </button>
                <button onClick={() => setShowActions(!showActions)}
                    className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--hover)] transition-all duration-200">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>
                </button>
            </div>

            {showActions && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                    <div className="absolute right-2 top-12 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] z-20 overflow-hidden min-w-[180px] animate-[scaleIn_0.15s_ease]"
                        style={{boxShadow: 'var(--shadow-xl)'}} onMouseLeave={() => setShowActions(false)}>
                        <div className="p-1.5">
                            {!task.completed && (
                                <button onClick={() => { onToggleInProgress(task.id); setShowActions(false); }}
                                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150 ${task.inProgress ? 'text-[var(--warning)] font-bold' : 'text-[var(--text)]'}`}>
                                    <span className="text-base w-5 text-center">{task.inProgress ? '⏸' : '▶'}</span> {task.inProgress ? 'Pausar' : 'Iniciar'}
                                </button>
                            )}
                            <button onClick={() => { onTogglePin(task.id); setShowActions(false); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                <span className="text-base w-5 text-center">{task.pinned ? '☆' : '★'}</span> {task.pinned ? 'Desfijar' : 'Fijar'}
                            </button>
                            <button onClick={() => { setShowSubtaskInput(!showSubtaskInput); setShowActions(false); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                <span className="text-base w-5 text-center">☑</span> Subtarea
                            </button>
                            <button onClick={() => { setShowNotes(!showNotes); setShowActions(false); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                <span className="text-base w-5 text-center">📝</span> Notas
                            </button>
                            <button onClick={handleAddToCalendar}
                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                <span className="text-base w-5 text-center">📅</span> Agregar al calendario
                            </button>
                        </div>
                        <div className="h-px bg-[var(--border)] mx-3" />
                        <div className="p-1.5">
                            <button onClick={() => { onDelete(task.id); setShowActions(false); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                <span className="text-base w-5 text-center">🗑</span> Eliminar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </li>
    );
}
