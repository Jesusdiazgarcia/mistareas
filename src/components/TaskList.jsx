import { useState } from 'react';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import { categories } from '../utils/helpers';

const CHECK = 'M2 5l2.5 2.5L8 3';

/** Index header plus multi-select actions. */
function SelectionBar({ total, allSelected, someSelected, selectedCount, onSelectAll, onExportCalendar, onBulkCategory, onBulkDelete }) {
    return (
        <div className="border-b border-[var(--border)] mb-1">
            <div className="flex items-center justify-between gap-3 py-2">
                <span className="kicker">Índice · {total} entrada{total === 1 ? '' : 's'}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-muted)] tracking-[0.02em]">
                        {selectedCount > 0 ? `${selectedCount} seleccionada${selectedCount > 1 ? 's' : ''}` : 'Seleccionar todo'}
                    </span>
                    <button onClick={onSelectAll} aria-label="Seleccionar todas las tareas visibles" aria-pressed={allSelected}
                        className={`relative after:absolute after:-inset-3 after:content-[''] w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors duration-150 ${someSelected ? 'bg-[var(--accent-fill)] border-[var(--accent-fill)]' : 'border-[var(--border-strong)] bg-transparent hover:border-[var(--accent)]'}`}>
                        {allSelected && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d={CHECK} stroke="var(--on-accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        {someSelected && !allSelected && <span className="w-1.5 h-px bg-[var(--on-accent)]" />}
                    </button>
                </div>
            </div>
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 justify-end pb-2">
                    <button onClick={onExportCalendar}
                        className="h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors duration-150">
                        Calendario
                    </button>
                    <select onChange={(event) => { onBulkCategory(event.target.value); event.target.value = 'none'; }}
                        aria-label="Cambiar categoría de las tareas seleccionadas"
                        className="h-7 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[11px] outline-none">
                        <option value="none">Categoría</option>
                        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <button onClick={onBulkDelete}
                        className="h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[11px] text-[var(--danger)] hover:border-[var(--danger)] transition-colors duration-150">
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}

export default function TaskList({ tasks, api, selection, collapsed, onToggleCollapse, filter, onBulkCategory, onExportSelection }) {
    const [draggedId, setDraggedId] = useState(null);
    const { selectedIds, toggleSelect, selectAll, clearSelection } = selection;
    const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;

    return (
        <>
            {tasks.length > 0 && (
                <SelectionBar
                    total={tasks.length}
                    allSelected={allSelected}
                    someSelected={selectedIds.size > 0}
                    selectedCount={selectedIds.size}
                    onSelectAll={selectAll}
                    onExportCalendar={() => onExportSelection(selectedIds)}
                    onBulkCategory={(category) => onBulkCategory([...selectedIds], category)}
                    onBulkDelete={() => { api.deleteMany([...selectedIds]); clearSelection(); }}
                />
            )}

            <ul id="taskList" aria-label="Lista de tareas" className="border-t border-[var(--border)]">
                {tasks.map((task, index) => (
                    <TaskItem key={task.id} task={task} index={index} selected={selectedIds.has(task.id)}
                        onToggle={api.toggleTask} onDelete={api.deleteTask} onTogglePin={api.togglePin}
                        onToggleSubtask={api.toggleSubtask} onAddSubtask={api.addSubtask}
                        onToggleSelect={toggleSelect} onEdit={api.editTask} onToggleInProgress={api.toggleInProgress}
                        collapsed={collapsed.has(task.id)} onToggleCollapse={onToggleCollapse}
                        onSaveNotes={api.saveNotes} onReschedule={api.rescheduleTask} onSnooze={api.snoozeTask}
                        onDragStart={(event) => { setDraggedId(task.id); event.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => setDraggedId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => { event.preventDefault(); if (draggedId !== task.id) api.reorder(draggedId, task.id); }} />
                ))}
            </ul>

            {tasks.length === 0 && <EmptyState filter={filter} />}
        </>
    );
}
