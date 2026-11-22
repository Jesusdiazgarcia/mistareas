import { useState } from 'react';
import { categories, priorities } from '../utils/helpers';

const FILTERS = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'inprogress', label: 'En progreso' },
    { id: 'completed', label: 'Hechas' },
    { id: 'recurring', label: 'Recurrentes' }
];

const FIELD = 'w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[13px] outline-none focus:border-[var(--accent)] transition-colors duration-150 appearance-none';
const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238a919b' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E\")";

export default function Filters({ currentFilter, setFilter, search, setSearch, filterCategory, setFilterCategory, filterPriority, setFilterPriority, currentSort, setSort }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const activeCount = [filterCategory !== 'all', filterPriority !== 'all', currentSort !== 'default'].filter(Boolean).length;
    const selectStyle = { backgroundImage: CHEVRON, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '26px' };

    return (
        <div className="mb-4">
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" /><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                <input type="search" placeholder="Buscar tareas..." value={search} onChange={event => setSearch(event.target.value)}
                    className="w-full h-10 pl-9 pr-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-[13px] outline-none focus:border-[var(--border-strong)] transition-colors duration-150" />
                <button onClick={() => setShowAdvanced(!showAdvanced)} aria-label="Filtros avanzados" aria-expanded={showAdvanced}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center transition-colors duration-150 ${showAdvanced || activeCount > 0 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    {activeCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--accent-fill)] text-[var(--on-accent)] text-[8px] font-bold flex items-center justify-center">{activeCount}</span>
                    )}
                </button>
            </div>

            {showAdvanced && (
                <div className="mt-2 p-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] space-y-2 animate-[fadeIn_0.15s_ease]">
                    <select value={filterCategory} onChange={event => setFilterCategory(event.target.value)} aria-label="Categoría" className={FIELD} style={selectStyle}>
                        <option value="all">Todas las categorías</option>
                        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <select value={filterPriority} onChange={event => setFilterPriority(event.target.value)} aria-label="Prioridad" className={FIELD} style={selectStyle}>
                        <option value="all">Todas las prioridades</option>
                        {priorities.map(priority => <option key={priority.id} value={priority.id}>{priority.name}</option>)}
                    </select>
                    <select value={currentSort} onChange={event => setSort(event.target.value)} aria-label="Orden" className={FIELD} style={selectStyle}>
                        <option value="default">Orden default</option>
                        <option value="priority">Por prioridad</option>
                        <option value="date">Por fecha</option>
                        <option value="category">Por categoría</option>
                        <option value="name">Por nombre</option>
                    </select>
                </div>
            )}

            <div className="flex gap-5 mt-3 overflow-x-auto border-b border-[var(--border)]" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {FILTERS.map(item => (
                    <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={currentFilter === item.id}
                        className={`shrink-0 -mb-px h-9 px-0.5 border-b text-[11.5px] tracking-[0.02em] whitespace-nowrap transition-colors duration-150 ${currentFilter === item.id ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
