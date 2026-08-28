import { useState } from 'react';
import { categories, priorities } from '../utils/helpers';

const filterData = [
    { id: 'all', label: 'Todas', icon: <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M1.5 6h9M1.5 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'pending', label: 'Pendientes', icon: <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'inprogress', label: 'En progreso', icon: <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v2l1.5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id: 'completed', label: 'Hechas', icon: <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id: 'recurring', label: 'Recurrentes', icon: <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M10 3A4.5 4.5 0 0 0 3 6a4.5 4.5 0 0 0 7 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M10 1v2.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
];

export default function Filters({ currentFilter, setFilter, search, setSearch, filterCategory, setFilterCategory, filterPriority, setFilterPriority, currentSort, setSort }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const activeCount = [filterCategory !== 'all', filterPriority !== 'all', currentSort !== 'default'].filter(Boolean).length;

    const sel = "w-full px-3 py-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] appearance-none transition-all duration-200";

    return (
        <div className="mb-4">
            <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <input type="search" placeholder="Buscar tareas..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-11 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-200"
                    style={{boxShadow: 'var(--shadow-sm)'}} />
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[12px] flex items-center justify-center transition-all duration-200 active:scale-90 ${showAdvanced ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--hover)]'}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    {activeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">{activeCount}</span>
                    )}
                </button>
            </div>

            {showAdvanced && (
                <div className="mt-2.5 p-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] space-y-2.5 animate-[fadeIn_0.15s_ease]"
                    style={{boxShadow: 'var(--shadow-sm)'}}>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={sel}
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                        <option value="all">Todas las categorías</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={sel}
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                        <option value="all">Todas las prioridades</option>
                        {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={currentSort} onChange={e => setSort(e.target.value)} className={sel}
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                        <option value="default">Orden default</option>
                        <option value="priority">Por prioridad</option>
                        <option value="date">Por fecha</option>
                        <option value="category">Por categoría</option>
                        <option value="name">Por nombre</option>
                    </select>
                </div>
            )}

            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1" style={{scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
                {filterData.map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-[12px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${currentFilter === f.id ? 'bg-[var(--accent)] text-white shadow-sm' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
                        style={currentFilter === f.id ? {boxShadow: '0 2px 8px rgba(76,110,245,0.25)'} : {}}>
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
