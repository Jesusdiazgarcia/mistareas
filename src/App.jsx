import { useCallback, useEffect, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useSelection } from './hooks/useSelection';
import { useImportExport } from './hooks/useImportExport';
import { useTheme } from './hooks/useTheme';

import Header from './components/Header';
import TaskInput from './components/TaskInput';
import Filters from './components/Filters';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import Modal from './components/Modal';
import Stats from './components/Stats';
import History from './components/History';
import WeeklyReport from './components/WeeklyReport';
import StorageWarning from './components/StorageWarning';
import AppFooter, { ImportInputs } from './components/AppFooter';
import TodayView from './components/TodayView';
import TrashView from './components/TrashView';
import UpdatePrompt from './components/UpdatePrompt';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import FocusView from './components/FocusView';
import DayReview from './components/DayReview';
import ReminderBanner from './components/ReminderBanner';
import DueSummary from './components/DueSummary';

const MODAL_TITLES = { history: 'Historial', stats: 'Estadísticas', report: 'Reporte Semanal', trash: 'Papelera', review: 'Cierre del día' };

function ModalContent({ mode, tasks, history, trash, onUndoHistory, onRestore, onDeleteForever, onEmptyTrash, onRescheduleOverdue, onOpenToday }) {
    if (mode === 'history') return <History history={history} onUndo={onUndoHistory} />;
    if (mode === 'stats') return <Stats tasks={tasks} />;
    if (mode === 'report') return <WeeklyReport tasks={tasks} />;
    if (mode === 'review') return (
        <DayReview
            tasks={tasks}
            onRescheduleOverdue={onRescheduleOverdue}
            onOpenToday={onOpenToday} />
    );
    if (mode === 'trash') return (
        <TrashView
            trash={trash}
            onRestore={onRestore}
            onDeleteForever={onDeleteForever}
            onEmptyTrash={onEmptyTrash} />
    );
    return null;
}

export default function App() {
    const store = useTasks();
    const filters = useTaskFilters(store.tasks);
    const selection = useSelection(filters.filteredTasks);
    const importer = useImportExport({
        tasks: store.tasks,
        syncTasks: store.syncTasks,
        history: store.history,
        syncHistory: store.syncHistory,
        addHistory: store.addHistory
    });
    const { isDark, toggleTheme } = useTheme();
    const pwa = usePwaUpdate();
    const focusDone = store.focusIds.filter(id => store.tasks.find(task => task.id === id)?.completed).length;

    const [view, setView] = useState('list');
    const [modal, setModal] = useState({ show: false, mode: '' });
    const [collapsedSubtasks, setCollapsedSubtasks] = useState(() => new Set());

    const toggleCollapse = useCallback((id) => {
        setCollapsedSubtasks(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    /** Lleva a la tarea del recordatorio: cambia a Lista, hace scroll y la resalta un momento. */
    const openReminderTask = useCallback((id) => {
        setView('list');
        setTimeout(() => {
            const element = document.querySelector(`[data-task-id="${id}"]`);
            if (!element) return;
            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
            element.style.transition = 'background-color 0.4s ease';
            element.style.backgroundColor = 'var(--accent-soft)';
            setTimeout(() => { element.style.backgroundColor = ''; }, 1600);
        }, 80);
    }, []);

    const openModal = useCallback((mode) => setModal({ show: true, mode }), []);
    const closeModal = useCallback(() => setModal({ show: false, mode: '' }), []);

    // Captura rápida: "n" enfoca el composer; Escape cierra el modal abierto.
    useEffect(() => {
        const handler = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key === 'Escape' && modal.show) {
                closeModal();
                return;
            }
            const active = document.activeElement;
            const typing = active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'SELECT' ||
                active.isContentEditable
            );
            if (typing || modal.show) return;
            if (event.key === 'n' || event.key === 'N') {
                event.preventDefault();
                if (view !== 'list') setView('list');
                setTimeout(() => document.getElementById('taskInput')?.focus(), 0);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [modal.show, view, closeModal]);

    const now = new Date();
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
    const weekday = capitalize(now.toLocaleDateString('es-CL', { weekday: 'long' }));
    const dateLine = now.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });

    return (
        <main className="mx-auto w-full max-w-[560px] lg:max-w-[1080px] px-5 lg:px-10 pt-6 lg:pt-14 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
            <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
                <Header
                    statsText={store.statsText}
                    currentView={view}
                    setView={setView}
                    onUndo={store.undo}
                    onRedo={store.redo}
                    canUndo={store.canUndo}
                    canRedo={store.canRedo}
                    onHistory={() => openModal('history')}
                    onStats={() => openModal('stats')}
                    onReport={() => openModal('report')}
                    onTrash={() => openModal('trash')}
                    onReview={() => openModal('review')}
                    focusDone={focusDone}
                    focusTotal={store.focusIds.length}
                    isDark={isDark}
                    toggleTheme={toggleTheme} />

                <div className="min-w-0 lg:max-w-[640px]">
                    <StorageWarning
                        message={store.storageError}
                        onDismiss={store.dismissStorageError}
                        onExport={importer.exportBackup} />

                    <ReminderBanner tasks={store.tasks} onOpen={openReminderTask} />

                    <DueSummary tasks={store.tasks} onOpenToday={() => setView('today')} />

                    <p className="brand-type mb-6 text-[19px] leading-[1.25] text-[var(--text)] lg:mb-9 lg:text-[26px] lg:leading-[1.2]">
                        {weekday}, {dateLine}
                    </p>

                    {view === 'list' && <TaskInput onAdd={store.addTask} />}

                    <Filters
                        currentFilter={filters.filter}
                        setFilter={filters.setFilter}
                        search={filters.search}
                        setSearch={filters.setSearch}
                        filterCategory={filters.filterCategory}
                        setFilterCategory={filters.setFilterCategory}
                        filterPriority={filters.filterPriority}
                        setFilterPriority={filters.setFilterPriority}
                        currentSort={filters.sort}
                        setSort={filters.setSort} />

                    {view === 'list' && (
                        <TaskList
                            tasks={filters.filteredTasks}
                            api={store}
                            selection={selection}
                            collapsed={collapsedSubtasks}
                            onToggleCollapse={toggleCollapse}
                            filter={filters.filter}
                            onBulkCategory={store.setCategoryForMany}
                            onExportSelection={importer.exportSelectionToCalendar} />
                    )}

                    {view === 'calendar' && (
                        <CalendarView tasks={store.tasks} onSetDueDate={() => setView('list')} />
                    )}

                    {view === 'focus' && (
                        <FocusView
                            tasks={store.tasks}
                            focusIds={store.focusIds}
                            onToggle={store.toggleTask}
                            onToggleFocus={store.toggleFocus}
                            onClear={store.clearFocus}
                            onGoList={() => setView('list')} />
                    )}

                    {view === 'today' && (
                        <TodayView
                            tasks={store.tasks}
                            onToggle={store.toggleTask}
                            onSetDueDate={() => setView('list')}
                            onSnooze={store.snoozeTask} />
                    )}

                    {view === 'kanban' && (
                        <KanbanView tasks={store.tasks} onToggle={store.toggleTask} onMoveTask={store.moveKanbanTask} />
                    )}

                    <AppFooter
                        hasCompleted={store.tasks.some(task => task.completed)}
                        onClearCompleted={store.clearCompleted}
                        importer={importer}
                        total={store.tasks.length} />

                    <ImportInputs importer={importer} />

                    <Modal
                        show={modal.show}
                        title={MODAL_TITLES[modal.mode]}
                        onClose={closeModal}>
                        <ModalContent
                            mode={modal.mode}
                            tasks={store.tasks}
                            history={store.history}
                            trash={store.trash}
                            onUndoHistory={store.undoHistoryEntry}
                            onRestore={store.restoreFromTrash}
                            onDeleteForever={store.deleteForever}
                            onEmptyTrash={store.emptyTrash}
                            onRescheduleOverdue={store.rescheduleOverdue}
                            onOpenToday={() => { closeModal(); setView('today'); }} />
                    </Modal>
                </div>
            </div>
            <UpdatePrompt show={pwa.needRefresh} onUpdate={pwa.applyUpdate} onDismiss={pwa.dismissUpdate} />
        </main>
    );
}
