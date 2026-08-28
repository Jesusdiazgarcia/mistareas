import { useState, useCallback, useRef, useEffect } from 'react';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { generateId, sortTaskArray } from './utils/helpers';
import { parseTasksFromText } from './utils/textParser';
import { categories, priorities } from './utils/helpers';
import { generateTasksICS, downloadICS } from './utils/calendarExport';

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
    const { tasks, syncTasks, history, syncHistory, isSyncing, syncStatus } = useFirebaseSync();
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState('list');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [sort, setSort] = useState('default');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [collapsedSubtasks, setCollapsedSubtasks] = useState(new Set());
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [modal, setModal] = useState({ show: false, title: '', mode: '', content: null });
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [showImportMenu, setShowImportMenu] = useState(false);

    const pdfInputRef = useRef(null);
    const textInputRef = useRef(null);
    const jsonInputRef = useRef(null);
    const undoRef = useRef(null);
    const redoRef = useRef(null);

    // Theme
    useEffect(() => {
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault(); undoRef.current?.();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Z')) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault(); redoRef.current?.();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const pushUndo = useCallback((action) => {
        setUndoStack(prev => [...prev.slice(-49), action]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, action]);

        let newTasks = [...tasks];
        if (action.type === 'delete') newTasks.push(action.task);
        else if (action.type === 'complete') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) { task.completed = action.prev; if (!action.prev) task.inProgress = false; }
        } else if (action.type === 'bulk-delete') {
            newTasks.push(...action.tasks);
        } else if (action.type === 'bulk-category') {
            action.ids.forEach(id => { const task = newTasks.find(t => t.id === id); if (task) task.category = action.prevCategory; });
        } else if (action.type === 'edit') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.text = action.prevText;
        } else if (action.type === 'toggle-progress') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.inProgress = action.prev;
        }
        syncTasks(newTasks);
    }, [undoStack, tasks, syncTasks]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, action]);

        let newTasks = [...tasks];
        if (action.type === 'delete') newTasks = newTasks.filter(t => t.id !== action.task.id);
        else if (action.type === 'complete') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) { task.completed = !action.prev; if (!action.prev) task.inProgress = false; }
        } else if (action.type === 'bulk-delete') {
            const ids = new Set(action.tasks.map(t => t.id));
            newTasks = newTasks.filter(t => !ids.has(t.id));
        } else if (action.type === 'bulk-category') {
            action.ids.forEach(id => { const task = newTasks.find(t => t.id === id); if (task) task.category = action.newCategory; });
        } else if (action.type === 'edit') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.text = action.newText;
        } else if (action.type === 'toggle-progress') {
            const task = newTasks.find(t => t.id === action.id);
            if (task) task.inProgress = !action.prev;
        }
        syncTasks(newTasks);
    }, [redoStack, tasks, syncTasks]);

    // Keep refs up to date for keyboard shortcuts
    undoRef.current = undo;
    redoRef.current = redo;

    // Filtered and sorted tasks
    const filteredTasks = (() => {
        let filtered = tasks;
        if (filter === 'pending') filtered = filtered.filter(t => !t.completed && !t.inProgress);
        else if (filter === 'inprogress') filtered = filtered.filter(t => !t.completed && t.inProgress);
        else if (filter === 'completed') filtered = filtered.filter(t => t.completed);
        else if (filter === 'recurring') filtered = filtered.filter(t => t.repeat && t.repeat !== 'none');

        if (search.trim()) filtered = filtered.filter(t => t.text.toLowerCase().includes(search.toLowerCase().trim()));
        if (filterCategory !== 'all') filtered = filtered.filter(t => (t.category || 'none') === filterCategory);
        if (filterPriority !== 'all') filtered = filtered.filter(t => (t.priority || 'none') === filterPriority);

        return sortTaskArray(filtered, sort);
    })();

    // Stats
    const pending = tasks.filter(t => !t.completed).length;
    const totalEst = tasks.filter(t => !t.completed).reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const statsText = tasks.length === 0 ? '0 tareas pendientes' :
        pending === 0 ? `Todas completadas! (${tasks.length})` :
        `${pending} tarea${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''}${totalEst > 0 ? ` · ~${totalEst < 60 ? totalEst + 'min' : Math.floor(totalEst/60) + 'h ' + (totalEst%60) + 'min'} restantes` : ''}`;

    // History helper - uses functional update to avoid stale history closure
    const addHistory = useCallback((type, text) => {
        const newEntry = { type, text: text.substring(0, 50), timestamp: new Date().toISOString() };
        syncHistory(prev => [newEntry, ...prev].slice(0, 100));
    }, [syncHistory]);

    // Task operations
    const addTask = useCallback((data) => {
        const newTask = {
            id: generateId(tasks),
            text: data.text,
            completed: false,
            inProgress: false,
            pinned: false,
            category: data.category,
            priority: data.priority,
            repeat: data.repeat,
            dueDate: data.dueDate,
            subtasks: [],
            notes: data.notes,
            estimatedMinutes: data.estimatedMinutes,
            createdAt: new Date().toISOString()
        };
        syncTasks([...tasks, newTask]);
        addHistory('created', data.text);
    }, [tasks, syncTasks, addHistory]);

    const toggleTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        pushUndo({ type: 'complete', id, prev: task.completed });

        let newTasks = tasks.map(t => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            return { ...t, completed, inProgress: completed ? false : t.inProgress };
        });

        if (!task.completed) {
            addHistory('completed', task.text);
            if (task.repeat && task.repeat !== 'none') {
                newTasks.push({
                    ...task, id: generateId(newTasks), completed: false, inProgress: false,
                    createdAt: new Date().toISOString()
                });
                addHistory('created', `[Recurrente] ${task.text}`);
            }
        }

        syncTasks(newTasks);
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const deleteTask = useCallback((id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            pushUndo({ type: 'delete', task: { ...task } });
            addHistory('deleted', task.text);
        }
        syncTasks(tasks.filter(t => t.id !== id));
        setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const togglePin = useCallback((id) => {
        syncTasks(tasks.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
    }, [tasks, syncTasks]);

    const editTask = useCallback((id, newText, prevText) => {
        pushUndo({ type: 'edit', id, prevText, newText });
        syncTasks(tasks.map(t => t.id === id ? { ...t, text: newText } : t));
    }, [tasks, syncTasks, pushUndo]);

    const saveNotes = useCallback((id, notes) => {
        syncTasks(tasks.map(t => t.id === id ? { ...t, notes } : t));
    }, [tasks, syncTasks]);

    const addSubtask = useCallback((taskId, text) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            return { ...t, subtasks: [...(t.subtasks || []), { text, completed: false }] };
        }));
    }, [tasks, syncTasks]);

    const toggleSubtask = useCallback((taskId, subIndex) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            const subtasks = t.subtasks.map((s, i) => i === subIndex ? { ...s, completed: !s.completed } : s);
            return { ...t, subtasks };
        }));
    }, [tasks, syncTasks]);

    const toggleCollapse = useCallback((id) => {
        setCollapsedSubtasks(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    }, []);

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.size === filteredTasks.length) return new Set();
            return new Set(filteredTasks.map(t => t.id));
        });
    }, [filteredTasks]);

    const bulkDelete = useCallback(() => {
        const toDelete = tasks.filter(t => selectedIds.has(t.id));
        pushUndo({ type: 'bulk-delete', tasks: toDelete.map(t => ({ ...t })) });
        toDelete.forEach(t => addHistory('deleted', t.text));
        syncTasks(tasks.filter(t => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
    }, [tasks, selectedIds, syncTasks, addHistory, pushUndo]);

    const bulkChangeCategory = useCallback((catId) => {
        const firstCat = tasks.find(t => selectedIds.has(t.id))?.category || 'none';
        pushUndo({ type: 'bulk-category', ids: [...selectedIds], prevCategory: firstCat, newCategory: catId });
        syncTasks(tasks.map(t => selectedIds.has(t.id) ? { ...t, category: catId } : t));
    }, [tasks, selectedIds, syncTasks, pushUndo]);

    const clearCompleted = useCallback(() => {
        const completed = tasks.filter(t => t.completed);
        pushUndo({ type: 'bulk-delete', tasks: completed.map(t => ({ ...t })) });
        completed.forEach(t => addHistory('deleted', t.text));
        syncTasks(tasks.filter(t => !t.completed));
    }, [tasks, syncTasks, addHistory, pushUndo]);

    const exportToCalendar = useCallback(() => {
        const tasksWithDate = tasks.filter(t => t.dueDate);
        if (tasksWithDate.length === 0) { alert('No hay tareas con fecha para exportar al calendario.'); return; }
        const ics = generateTasksICS(tasksWithDate);
        downloadICS('mis_tareas.ics', ics);
    }, [tasks]);

    const exportSelectedToCalendar = useCallback(() => {
        const selected = tasks.filter(t => selectedIds.has(t.id));
        if (selected.length === 0) return;
        const ics = generateTasksICS(selected);
        downloadICS('tareas_seleccionadas.ics', ics);
    }, [tasks, selectedIds]);

    const moveKanbanTask = useCallback((taskId, status) => {
        syncTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            if (status === 'completed') return { ...t, completed: true, inProgress: false };
            if (status === 'in-progress') return { ...t, completed: false, inProgress: true };
            return { ...t, completed: false, inProgress: false };
        }));
    }, [tasks, syncTasks]);

    const handleDragDrop = useCallback((draggedId, droppedId) => {
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const droppedIndex = tasks.findIndex(t => t.id === droppedId);
        if (draggedIndex === -1 || droppedIndex === -1) return;
        const newTasks = [...tasks];
        const [removed] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(droppedIndex, 0, removed);
        syncTasks(newTasks);
    }, [tasks, syncTasks]);

    // Import handlers
    const handleImportJson = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    syncTasks(imported);
                }
            } catch (err) { console.error('Import error:', err); }
        };
        reader.readAsText(file);
    };

    const handleImportText = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const parsed = parseTasksFromText(e.target.result);
            if (parsed.length === 0) { alert('No se encontraron tareas.'); return; }
            const newTasks = parsed.map((t, i) => ({
                id: generateId(tasks) + i,
                text: t.text, completed: false, inProgress: false, pinned: false,
                category: t.category, priority: t.priority, repeat: 'none',
                dueDate: null, subtasks: [], notes: t.notes || '',
                estimatedMinutes: 0, createdAt: new Date().toISOString()
            }));
            syncTasks([...tasks, ...newTasks]);
            addHistory('created', `[Importados] ${newTasks.length} tareas`);
        };
        reader.readAsText(file);
    };

    const handleImportPdf = async (file) => {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            const parsed = parseTasksFromText(fullText);
            if (parsed.length === 0) { alert('No se encontraron tareas en el PDF.'); return; }
            const newTasks = parsed.map((t, i) => ({
                id: generateId(tasks) + i,
                text: t.text, completed: false, inProgress: false, pinned: false,
                category: t.category, priority: t.priority, repeat: 'none',
                dueDate: null, subtasks: [], notes: t.notes || '',
                estimatedMinutes: 0, createdAt: new Date().toISOString()
            }));
            syncTasks([...tasks, ...newTasks]);
            addHistory('created', `[Importados PDF] ${newTasks.length} tareas`);
        } catch (err) { console.error('PDF import error:', err); alert('Error al leer el PDF.'); }
    };

    // Export
    const exportJson = () => {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `tareas_${new Date().toISOString().slice(0, 10)}.json`;
        a.click(); URL.revokeObjectURL(url);
    };

    const exportCsv = () => {
        const headers = ['Tarea', 'Categoría', 'Prioridad', 'Repetir', 'Fecha límite', 'Completada', 'Subtareas'];
        const rows = tasks.map(t => [
            `"${t.text.replace(/"/g, '""')}"`,
            categories.find(c => c.id === (t.category || 'none'))?.name || '',
            priorities.find(p => p.id === (t.priority || 'none'))?.name || '',
            { none: '', daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }[t.repeat] || '',
            t.dueDate || '', t.completed ? 'Sí' : 'No', (t.subtasks || []).length
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `tareas_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    // Drag state for list
    const [draggedId, setDraggedId] = useState(null);

    return (
        <main className="max-w-[480px] mx-auto px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
            <Header statsText={statsText} currentView={view} setView={setView}
                onUndo={undo} onRedo={redo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                onHistory={() => setModal({ show: true, title: 'Historial', mode: 'history', content: <History history={history} /> })}
                onStats={() => setModal({ show: true, title: 'Estadísticas', mode: 'stats', content: <Stats tasks={tasks} /> })}
                onReport={() => setModal({ show: true, title: 'Reporte Semanal', mode: 'stats', content: <WeeklyReport tasks={tasks} /> })}
                isDark={isDark} toggleTheme={() => setIsDark(!isDark)} syncStatus={syncStatus} />

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
                                onToggleSelect={toggleSelect} onEdit={editTask}
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
