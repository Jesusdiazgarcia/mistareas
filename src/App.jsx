import { useCallback, useState } from 'react';
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
import AppFooter, { ImportInputs } from './components/AppFooter';

const MODAL_TITLES = { history: 'Historial', stats: 'Estadísticas', report: 'Reporte Semanal' };

function ModalContent({ mode, tasks, history }) {
    if (mode === 'history') return <History history={history} />;
    if (mode === 'stats') return <Stats tasks={tasks} />;
    if (mode === 'report') return <WeeklyReport tasks={tasks} />;
    return null;
}

export default function App() {
    const store = useTasks();
    const filters = useTaskFilters(store.tasks);
    const selection = useSelection(filters.filteredTasks);
    const importer = useImportExport({
        tasks: store.tasks,
        syncTasks: store.syncTasks,
        addHistory: store.addHistory
    });
    const { isDark, toggleTheme } = useTheme();

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

    const openModal = useCallback((mode) => setModal({ show: true, mode }), []);
    const closeModal = useCallback(() => setModal({ show: false, mode: '' }), []);

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
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    syncStatus={store.syncStatus} />

                <div className="min-w-0 lg:max-w-[640px]">
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
                        mode={modal.mode}
                        onClose={closeModal}
                        onSave={closeModal}>
                        <ModalContent mode={modal.mode} tasks={store.tasks} history={store.history} />
                    </Modal>
                </div>
            </div>
        </main>
    );
}
