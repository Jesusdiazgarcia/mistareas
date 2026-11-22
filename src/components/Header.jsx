import { useState } from 'react';
import MenuPanel from './MenuPanel';
import HeaderMenu from './HeaderMenu';
import { editionNumber } from '../utils/helpers';

const ICON_BUTTON = 'w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] active:scale-90 transition-all duration-150';

const VIEWS = [
    { value: 'list', label: 'Lista' },
    { value: 'calendar', label: 'Calendario' },
    { value: 'kanban', label: 'Kanban' }
];

const SYNC = {
    synced: { label: 'Sync', dot: 'bg-[var(--accent)]', text: 'text-[var(--text-muted)]' },
    connecting: { label: 'Sync', dot: 'bg-[var(--accent)] animate-[pulse_2s_ease-in-out_infinite]', text: 'text-[var(--text-muted)]' },
    error: { label: 'Error', dot: 'bg-[var(--danger)]', text: 'text-[var(--danger)]' }
};

function SyncBadge({ status }) {
    const badge = SYNC[status];
    if (!badge) return null;
    return (
        <span className={`flex items-center gap-1.5 mr-1 text-[9px] font-medium uppercase tracking-[0.16em] ${badge.text}`}>
            <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
{badge.label}
        </span>
    );
}

export default function Header({ statsText, currentView, setView, onUndo, onRedo, canUndo, canRedo, onHistory, onStats, onReport, isDark, toggleTheme, syncStatus }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="mb-6 lg:mb-0 lg:sticky lg:top-14 lg:self-start">
            <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4 lg:flex-col lg:items-start lg:gap-4">
                <div className="min-w-0">
                    <h1 className="brand-type truncate text-[23px] leading-none text-[var(--text)]">Mis Tareas</h1>
                    <p className="kicker mt-2 truncate">Cuaderno · Nº {editionNumber()}</p>
                </div>

                <div className="flex items-center gap-0.5">
                    <SyncBadge status={syncStatus} />
                    <button onClick={toggleTheme} aria-label="Cambiar tema" className={ICON_BUTTON}>
                        {isDark
                            ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            : <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(prev => !prev)} aria-label="Más opciones" aria-expanded={menuOpen} aria-haspopup="menu" className={ICON_BUTTON}>
                            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.2" fill="currentColor" /><circle cx="9" cy="9" r="1.2" fill="currentColor" /><circle cx="9" cy="14" r="1.2" fill="currentColor" /></svg>
                        </button>
                        {menuOpen && (
                            <MenuPanel onClose={() => setMenuOpen(false)} className="right-0 top-10 w-[200px]">
                                <HeaderMenu
                                    onReport={() => { onReport(); setMenuOpen(false); }}
                                    onStats={() => { onStats(); setMenuOpen(false); }}
                                    onHistory={() => { onHistory(); setMenuOpen(false); }} />
                            </MenuPanel>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b border-[var(--border)] lg:flex-col lg:items-stretch lg:gap-2 lg:border-b-0">
                <div className="flex flex-1 min-w-0 items-stretch gap-5 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-visible" style={{ scrollbarWidth: 'none' }}>
                    {VIEWS.map(tab => (
                        <button key={tab.value} onClick={() => setView(tab.value)}
                            aria-current={currentView === tab.value ? 'page' : undefined}
                            className={`view-tab shrink-0 -mb-px h-10 px-0.5 border-b text-[12px] tracking-[0.02em] transition-colors duration-150 ${currentView === tab.value ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex shrink-0 gap-0.5">
                    <button onClick={onUndo} disabled={!canUndo} aria-label="Deshacer"
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-25 active:scale-90 transition-all duration-150 hover:bg-[var(--hover)] hover:text-[var(--text)]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 6h7a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 3L3 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} aria-label="Rehacer"
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-25 active:scale-90 transition-all duration-150 hover:bg-[var(--hover)] hover:text-[var(--text)]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 6H6a3 3 0 0 0 0 6h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)] tracking-[0.02em] lg:mt-4">{statsText}</p>
        </header>
    );
}
