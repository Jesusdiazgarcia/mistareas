import { useState, useCallback } from 'react';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useTheme } from './hooks/useTheme';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useSelection } from './hooks/useSelection';
import { useTaskActions } from './hooks/useTaskActions';
import { useImportExport } from './hooks/useImportExport';
import { categories } from './utils/helpers';

import Header from './components/Header';
import TaskInput from './components/TaskInput';
import Filters from './components/Filters';
import TaskItem from './components/TaskItem';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import Modal from './components/Modal';
import Stats from './components/Stats';
import History from './components/History';
import WeeklyReport from './components/WeeklyReport';
import EmptyState from './components/EmptyState';

export default function App() {
    const { tasks, syncTasks, history, syncHistory, syncStatus } = useFirebaseSync();
    const [view, setView] = useState('list');
    const [collapsedSubtasks, setCollapsedSubtasks] = useState(new Set());
    const [modal, setModal] = useState({ show: false, title: '', mode: '', content: null });
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [draggedId, setDraggedId] = useState(null);

    // History helper - uses functional update to avoid stale history closure
    const addHistory = useCallback((type, text) => {
        const newEntry = { type, text: text.substring(0, 50), timestamp: new Date().toISOString() };
        syncHistory(prev => [newEntry, ...prev].slice(0, 100));
    }, [syncHistory]);

    const { isDark, toggleTheme } = useTheme();
    const { undo, redo, pushUndo, canUndo, canRedo } = useUndoRedo({ tasks, syncTasks });
    const { filter, setFilter, search, setSearch, filterCategory, setFilterCategory, filterPriority, setFilterPriority, sort, setSort, filteredTasks } = useTaskFilters({ tasks });
    const { selectedIds, toggleSelect, selectAll, removeFromSelection, bulkDelete, bulkChangeCategory, clearCompleted, exportSelectedToCalendar } = useSelection({ tasks, filteredTasks, syncTasks, addHistory, pushUndo });
    const { addTask, toggleTask, deleteTask, togglePin, editTask, saveNotes, addSubtask, toggleSubtask, toggleInProgress, moveKanbanTask, handleDragDrop } = useTaskActions({ tasks, syncTasks, addHistory, pushUndo, removeFromSelection });
    const { handleImportJson, handleImportText, handleImportPdf, exportJson, exportCsv, exportToCalendar, pdfInputRef, textInputRef, jsonInputRef } = useImportExport({ tasks, syncTasks, addHistory });

    const toggleCollapse = useCallback((id) => {
        setCollapsedSubtasks(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });
    }, []);

    // Stats
    const pending = tasks.filter(t => !t.completed).length;
    const totalEst = tasks.filter(t => !t.completed).reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const statsText = tasks.length === 0 ? '0 tareas pendientes' :
        pending === 0 ? `Todas completadas! (${tasks.length})` :
        `${pending} tarea${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''}${totalEst > 0 ? ` · ~${totalEst < 60 ? totalEst + 'min' : Math.floor(totalEst/60) + 'h ' + (totalEst%60) + 'min'} restantes` : ''}`;

    return (
        <main className="max-w-[480px] mx-auto px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
            <Header statsText={statsText} currentView={view} setView={setView}
                onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
                onHistory={() => setModal({ show: true, title: 'Historial', mode: 'history', content: <History history={history} /> })}
                onStats={() => setModal({ show: true, title: 'Estadísticas', mode: 'stats', content: <Stats tasks={tasks} /> })}
                onReport={() => setModal({ show: true, title: 'Reporte Semanal', mode: 'stats', content: <WeeklyReport tasks={tasks} /> })}
                isDark={isDark} toggleTheme={toggleTheme} syncStatus={syncStatus} />

            {view === 'list' && <TaskInput onAdd={addTask} />}

            <Filters currentFilter={filter} setFilter={setFilter} search={search} setSearch={setSearch}
                filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                filterPriority={filterPriority} setFilterPriority={setFilterPriority}
                currentSort={sort} setSort={setSort} />

            {view === 'list' && (
                <>
                    {filteredTasks.length > 0 && (
                        <div className="flex items-center gap-2.5 p-2.5 mb-2">
                            <button onClick={selectAll}
                                className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${selectedIds.size === filteredTasks.length && filteredTasks.length > 0 ? 'bg-[var(--accent)] border-[var(--accent)]' : selectedIds.size > 0 ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]'}`}>
                                {selectedIds.size === filteredTasks.length && filteredTasks.length > 0 && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                {selectedIds.size > 0 && selectedIds.size < filteredTasks.length && <span className="w-2 h-0.5 bg-white rounded-full" />}
                            </button>
                            <span className="text-xs text-[var(--text-muted)] font-semibold">
                                {selectedIds.size > 0 ? `${selectedIds.size} seleccionada${selectedIds.size > 1 ? 's' : ''}` : 'Seleccionar todo'}
                            </span>
                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <button onClick={exportSelectedToCalendar}
                                        className="h-8 px-3 rounded-[12px] bg-[var(--accent-light)] text-[var(--accent)] text-xs font-bold active:scale-95 transition-all duration-200">
                                        📅 Calendario
                                    </button>
                                    <select onChange={(e) => { bulkChangeCategory(e.target.value); e.target.value = 'none'; }}
                                        className="h-8 px-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-xs font-semibold outline-none">
                                        <option value="none">Categoría</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button onClick={bulkDelete}
                                        className="h-8 px-3 rounded-[12px] bg-[var(--danger-light)] text-[var(--danger)] text-xs font-bold active:scale-95 transition-all duration-200">
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <ul id="taskList" aria-label="Lista de tareas" className="space-y-0">
                        {filteredTasks.map(task => (
                            <TaskItem key={task.id} task={task} selected={selectedIds.has(task.id)}
                                onToggle={toggleTask} onDelete={deleteTask} onTogglePin={togglePin}
                                onToggleSubtask={toggleSubtask} onAddSubtask={addSubtask}
                                onToggleSelect={toggleSelect} onEdit={editTask} onToggleInProgress={toggleInProgress}
                                collapsed={collapsedSubtasks.has(task.id)} onToggleCollapse={toggleCollapse}
                                onSaveNotes={saveNotes}
                                onDragStart={(e) => { setDraggedId(task.id); e.dataTransfer.effectAllowed = 'move'; }}
                                onDragEnd={() => setDraggedId(null)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); if (draggedId !== task.id) handleDragDrop(draggedId, task.id); }} />
                        ))}
                    </ul>
                    {filteredTasks.length === 0 && <EmptyState filter={filter} />}
                </>
            )}

            {view === 'calendar' && (
                <CalendarView tasks={tasks} onSetDueDate={() => setView('list')} />
            )}

            {view === 'kanban' && (
                <KanbanView tasks={tasks} onToggle={toggleTask} onMoveTask={moveKanbanTask} />
            )}

            <footer className="mt-6 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between gap-2">
                    <button disabled={!tasks.some(t => t.completed)} onClick={clearCompleted}
                        className="h-10 px-4 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold disabled:opacity-25 active:scale-95 transition-all duration-200 hover:bg-[var(--hover)]">
                        Limpiar completadas
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowImportMenu(!showImportMenu)}
                            className="h-10 px-4 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold active:scale-95 transition-all duration-200 hover:bg-[var(--hover)]">
                            Importar / Exportar
                        </button>
                        {showImportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowImportMenu(false)} />
                                <div className="absolute right-0 bottom-12 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] z-50 overflow-hidden min-w-[200px] animate-[scaleIn_0.15s_ease]"
                                    style={{boxShadow: 'var(--shadow-xl)'}} onMouseLeave={() => setShowImportMenu(false)}>
                                    <div className="p-1.5">
                                        <button onClick={() => { pdfInputRef.current?.click(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">📄 Importar PDF</button>
                                        <button onClick={() => { textInputRef.current?.click(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">📝 Importar texto</button>
                                        <button onClick={() => { jsonInputRef.current?.click(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">📋 Importar JSON</button>
                                    </div>
                                    <div className="h-px bg-[var(--border)] mx-3" />
                                    <div className="p-1.5">
                                        <button onClick={() => { exportJson(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">⬇️ Exportar JSON</button>
                                        <button onClick={() => { exportCsv(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">⬇️ Exportar CSV</button>
                                    </div>
                                    <div className="h-px bg-[var(--border)] mx-3" />
                                    <div className="p-1.5">
                                        <button onClick={() => { exportToCalendar(); setShowImportMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--accent)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150 font-bold">📅 Exportar al calendario</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </footer>

            <input ref={pdfInputRef} type="file" accept=".pdf" hidden onChange={(e) => { if (e.target.files[0]) { handleImportPdf(e.target.files[0]); e.target.value = ''; } }} />
            <input ref={textInputRef} type="file" accept=".txt,.md" hidden onChange={(e) => { if (e.target.files[0]) { handleImportText(e.target.files[0]); e.target.value = ''; } }} />
            <input ref={jsonInputRef} type="file" accept=".json" hidden onChange={(e) => { if (e.target.files[0]) { handleImportJson(e.target.files[0]); e.target.value = ''; } }} />

            <Modal show={modal.show} title={modal.title} mode={modal.mode}
                onClose={() => setModal({ show: false })} onSave={() => setModal({ show: false })}>
                {modal.content}
            </Modal>
        </main>
    );
}
