import { useState, useRef } from 'react';
import { categories, priorities, repeats, formatDate, formatMinutes } from '../utils/helpers';
import { parseMarkdown } from '../utils/markdown';
import MenuPanel, { MenuDivider } from './MenuPanel';
import { generateTaskICS, downloadICS } from '../utils/calendarExport';

function calcActualMinutes(startedAt, completedAt) {
    if (!startedAt || !completedAt) return 0;
    return Math.round((new Date(completedAt) - new Date(startedAt)) / 60000);
}

const ACTION = 'w-full px-3 py-2 text-left text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[var(--radius-sm)] transition-colors duration-150';

export default function TaskItem({ task, index, selected, onToggle, onDelete, onTogglePin, onToggleSubtask, onAddSubtask, onToggleSelect, onEdit, collapsed, onToggleCollapse, onSaveNotes, onToggleInProgress, onReschedule, onSnooze, onDragStart, onDragEnd, onDragOver, onDrop }) {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [showNotes, setShowNotes] = useState(false);
    const [notesText, setNotesText] = useState(task.notes || '');
    const [subtaskInput, setSubtaskInput] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(task.dueDate || '');
    const [scheduleTime, setScheduleTime] = useState(task.dueTime || '');
    const editRef = useRef(null);

    const category = categories.find(item => item.id === (task.category || 'none'));
    const priority = priorities.find(item => item.id === (task.priority || 'none'));
    const dateInfo = formatDate(task.dueDate);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const actualMinutes = calcActualMinutes(task.startedAt, task.completedAt);

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
    const openSchedule = () => {
        setScheduleDate(task.dueDate || '');
        setScheduleTime(task.dueTime || '');
        setShowSchedule(true);
        setShowActions(false);
    };
    const changeSchedule = (date, time) => {
        setScheduleDate(date);
        setScheduleTime(time);
        onReschedule(task.id, date || null, time || null);
    };

    const handleAddToCalendar = () => {
        const safeName = task.text.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_').substring(0, 30);
        downloadICS(`${safeName}.ics`, generateTaskICS(task));
        setShowActions(false);
    };

    return (
        <li data-task-id={task.id} className={`group relative flex items-start gap-3 py-3.5 border-b border-[var(--border)] last:border-b-0 transition-colors duration-150 ${selected ? 'bg-[var(--accent-soft)]' : ''}`}
            draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
            style={task.pinned ? { boxShadow: 'inset 1px 0 0 var(--accent)' } : undefined}>

            <button onClick={() => onToggle(task.id)} role="checkbox" aria-checked={task.completed}
                aria-label={task.completed ? `Marcar "${task.text}" como pendiente` : `Marcar "${task.text}" como completada`}
                className={`relative after:absolute after:-inset-3 after:content-[''] w-[17px] h-[17px] rounded-full border flex items-center justify-center shrink-0 mt-[3px] active:scale-90 transition-all duration-150 ${task.completed ? 'bg-[var(--accent-fill)] border-[var(--accent-fill)]' : 'border-[var(--border-strong)] bg-transparent hover:border-[var(--accent)]'}`}>
                {task.completed && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M3 6l2.5 2.5L9 4" stroke="var(--on-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <input ref={editRef} value={editText} onChange={event => setEditText(event.target.value)} onBlur={saveEdit} maxLength={500}
                        onKeyDown={event => { if (event.key === 'Enter') saveEdit(); if (event.key === 'Escape') { setEditText(task.text); setEditing(false); } }}
                        className="w-full px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text)] text-[14px] outline-none" />
                ) : (
                    <span onDoubleClick={handleDoubleClick} title="Doble clic para editar"
                        className={`block text-[13.5px] leading-[1.5] break-words cursor-default select-text ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(task.text) }} />
                )}

                <div className="meta-row mt-1.5">
                    {task.inProgress && !task.completed && (
                        <span className="accent flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-[pulse_2s_ease-in-out_infinite]" />
                            En progreso
                        </span>
                    )}
                    {category && category.id !== 'none' && <span>{category.name}</span>}
                    {priority && priority.id !== 'none' && (
                        <span className={priority.id === 'high' ? 'accent' : ''}>{priority.name}</span>
                    )}
                    {task.repeat && task.repeat !== 'none' && <span>{repeats[task.repeat]}</span>}
                    {dateInfo && (
                        <span className={dateInfo.status === 'overdue' ? 'text-[var(--danger)]' : dateInfo.status === 'today' ? 'text-[var(--text)]' : ''}>{dateInfo.label}</span>
                    )}
                    {task.dueTime && <span className="figure">{task.dueTime}</span>}
                    {task.estimatedMinutes > 0 && <span className="figure">{formatMinutes(task.estimatedMinutes)}</span>}
                    {task.completed && actualMinutes > 0 && (
                        <span className={`figure ${task.estimatedMinutes && actualMinutes > task.estimatedMinutes ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                            {formatMinutes(actualMinutes)} real
                        </span>
                    )}
                </div>

                {showSchedule && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input type="date" value={scheduleDate} aria-label="Fecha límite"
                            onChange={event => changeSchedule(event.target.value, scheduleTime)}
                            className="h-8 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[11.5px] outline-none focus:border-[var(--accent)]" />
                        <input type="time" value={scheduleTime} aria-label="Hora"
                            onChange={event => changeSchedule(scheduleDate, event.target.value)}
                            className="h-8 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[11.5px] outline-none focus:border-[var(--accent)]" />
                        <button onClick={() => setShowSchedule(false)}
                            className="h-8 px-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text)]">
                            Cerrar
                        </button>
                    </div>
                )}

                {task.notes && task.notes.trim() && !showNotes && !editing && (
                    <button onClick={() => setShowNotes(true)}
                        className="mt-2 w-full border-l border-[var(--border-strong)] pl-2.5 py-0.5 text-left text-[11.5px] italic leading-snug text-[var(--text-muted)] line-clamp-2 hover:border-[var(--accent)] hover:text-[var(--text-secondary)] transition-colors duration-150">
                        {task.notes.length > 50 ? task.notes.substring(0, 50) + '...' : task.notes}
                    </button>
                )}
                {showNotes && (
                    <textarea value={notesText} onChange={event => setNotesText(event.target.value)} onBlur={handleNotesBlur} placeholder="Notas..."
                        onKeyDown={event => { if (event.key === 'Escape') { handleNotesBlur(); setShowNotes(false); } }}
                        className="mt-2 w-full p-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[12.5px] outline-none focus:border-[var(--accent)] resize-y min-h-[58px] transition-colors duration-150" />
                )}

                {hasSubtasks && !editing && (
                    <button onClick={() => onToggleCollapse(task.id)}
                        className="flex items-center gap-1.5 mt-2 text-[11px] tracking-[0.02em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`}><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>{task.subtasks.filter(sub => sub.completed).length}/{task.subtasks.length} subtareas</span>
                    </button>
                )}

                {hasSubtasks && !collapsed && !editing && (
                    <div className="mt-1.5 border-l border-[var(--border)] pl-3 space-y-1">
                        {task.subtasks.map((sub, subIndex) => (
                            <div key={subIndex} className="flex items-center gap-2.5 py-0.5">
                                <button onClick={() => onToggleSubtask(task.id, subIndex)} role="checkbox" aria-checked={sub.completed} aria-label={sub.text}
                                    className={`relative after:absolute after:-inset-2 after:content-[''] w-[13px] h-[13px] rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${sub.completed ? 'bg-[var(--accent-fill)] border-[var(--accent-fill)]' : 'border-[var(--border-strong)] hover:border-[var(--accent)]'}`}>
                                    {sub.completed && <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="var(--on-accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </button>
                                <span className={`text-[12px] flex-1 ${sub.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>{sub.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {showSubtaskInput && !editing && (
                    <div className="flex gap-2 mt-2">
                        <input value={subtaskInput} onChange={event => setSubtaskInput(event.target.value)} placeholder="Subtarea..." autoFocus
                            onKeyDown={event => { if (event.key === 'Enter' && subtaskInput.trim()) handleAddSubtask(); if (event.key === 'Escape') { setShowSubtaskInput(false); setSubtaskInput(''); } }}
                            onBlur={() => { if (!subtaskInput.trim()) setShowSubtaskInput(false); }}
                            className="flex-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[12.5px] outline-none focus:border-[var(--accent)] transition-colors duration-150" />
                        <button onClick={handleAddSubtask}
                            className="px-3 rounded-[var(--radius-sm)] border border-[var(--border)] text-[11px] tracking-[0.06em] uppercase text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors duration-150">OK</button>
                    </div>
                )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                <span className="folio">{String((index ?? 0) + 1).padStart(2, '0')}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    <button onClick={() => onToggleSelect(task.id)} aria-label="Seleccionar"
                        className={`relative after:absolute after:-inset-2 after:content-[''] w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center transition-colors duration-150 ${selected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                        {selected
                            ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.1" /></svg>}
                    </button>
                    <button onClick={() => setShowActions(!showActions)} aria-label="Acciones de la tarea" aria-expanded={showActions} aria-haspopup="menu"
                        className="relative after:absolute after:-inset-2 after:content-[''] w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="0.9" fill="currentColor" /><circle cx="7" cy="7" r="0.9" fill="currentColor" /><circle cx="7" cy="11" r="0.9" fill="currentColor" /></svg>
                    </button>
                </div>
            </div>

            {showActions && (
                <MenuPanel onClose={() => setShowActions(false)} overlayClassName="z-10" panelClassName="z-20"
                    className="right-1 top-10 w-[200px]" shadow="var(--shadow-sm)">
                    <div className="p-1">
                        {!task.completed && (
                            <button onClick={() => { onToggleInProgress(task.id); setShowActions(false); }} className={ACTION}>
                                {task.inProgress ? 'Pausar' : 'Iniciar'}
                            </button>
                        )}
                        <button onClick={() => { onTogglePin(task.id); setShowActions(false); }} className={ACTION}>
                            {task.pinned ? 'Desfijar' : 'Fijar'}
                        </button>
                        <button onClick={() => { setShowSubtaskInput(!showSubtaskInput); setShowActions(false); }} className={ACTION}>Subtarea</button>
                        <button onClick={() => { setShowNotes(!showNotes); setShowActions(false); }} className={ACTION}>Notas</button>
                        <button onClick={handleAddToCalendar} className={ACTION}>Añadir al calendario</button>
                    </div>
                    <MenuDivider />
                    <div className="p-1">
                        <button onClick={() => { onSnooze(task.id, 0); setShowActions(false); }} className={ACTION}>Aplazar a hoy</button>
                        <button onClick={() => { onSnooze(task.id, 1); setShowActions(false); }} className={ACTION}>Aplazar a mañana</button>
                        <button onClick={() => { onSnooze(task.id, 7); setShowActions(false); }} className={ACTION}>Aplazar 1 semana</button>
                        {task.dueDate && (
                            <button onClick={() => { onSnooze(task.id, null); setShowActions(false); }} className={ACTION}>Quitar fecha</button>
                        )}
                        <button onClick={openSchedule} className={ACTION}>Programar hora</button>
                    </div>
                    <MenuDivider />
                    <div className="p-1">
                        <button onClick={() => { onDelete(task.id); setShowActions(false); }}
                            className={`${ACTION} text-[var(--danger)] hover:text-[var(--danger)]`}>Eliminar</button>
                    </div>
                </MenuPanel>
            )}
        </li>
    );
}
