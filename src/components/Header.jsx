import { useState } from 'react';

export default function Header({ statsText, currentView, setView, onUndo, onRedo, canUndo, canRedo, onHistory, onStats, onReport, isDark, toggleTheme, syncStatus }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[var(--radius)] bg-gradient-to-br from-[#4c6ef5] to-[#7c3aed] flex items-center justify-center shadow-sm">
                        <span className="text-white text-base font-bold">M</span>
                    </div>
                    <div>
                        <h1 className="text-[20px] font-extrabold tracking-tight text-[var(--text)] leading-tight">Mis Tareas</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {syncStatus === 'synced' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--success-light)] mr-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                            <span className="text-[10px] text-[var(--success)] font-bold hidden sm:inline">Sync</span>
                        </div>
                    )}
                    {syncStatus === 'connecting' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--warning-light)] mr-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-[pulse_2s_ease-in-out_infinite]" />
                            <span className="text-[10px] text-[var(--warning)] font-bold hidden sm:inline">Sync</span>
                        </div>
                    )}
                    {syncStatus === 'error' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--danger-light)] mr-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                            <span className="text-[10px] text-[var(--danger)] font-bold hidden sm:inline">Error</span>
                        </div>
                    )}
                    <button onClick={toggleTheme} aria-label="Cambiar tema"
                        className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover)] active:scale-90 transition-all duration-200">
                        {isDark
                            ? <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            : <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)}
                            className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover)] active:scale-90 transition-all duration-200">
                            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.3" fill="currentColor"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="14" r="1.3" fill="currentColor"/></svg>
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-12 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] z-50 overflow-hidden min-w-[200px] animate-[scaleIn_0.15s_ease]"
                                    style={{boxShadow: 'var(--shadow-xl)'}} onMouseLeave={() => setShowMenu(false)}>
                                    <div className="p-1.5">
                                        <button onClick={() => { onReport(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                            <div className="w-7 h-7 rounded-[10px] bg-[var(--accent-light)] flex items-center justify-center">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="1.5" stroke="var(--accent)" strokeWidth="1.2"/><path d="M4.5 7l2 2 3-3" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                            Reporte semanal
                                        </button>
                                        <button onClick={() => { onStats(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                            <div className="w-7 h-7 rounded-[10px] bg-[var(--success-light)] flex items-center justify-center">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="8" width="3" height="4.5" rx="0.5" stroke="var(--success)" strokeWidth="1.1"/><rect x="5.5" y="4.5" width="3" height="8" rx="0.5" stroke="var(--success)" strokeWidth="1.1"/><rect x="9.5" y="1.5" width="3" height="11" rx="0.5" stroke="var(--success)" strokeWidth="1.1"/></svg>
                                            </div>
                                            Estadísticas
                                        </button>
                                        <button onClick={() => { onHistory(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--hover)] rounded-[12px] flex items-center gap-3 transition-all duration-150">
                                            <div className="w-7 h-7 rounded-[10px] bg-[var(--warning-light)] flex items-center justify-center">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="var(--warning)" strokeWidth="1.2"/><path d="M7 4v3l2 1.5" stroke="var(--warning)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                            Historial
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex flex-1 p-1 rounded-[var(--radius-lg)] bg-[var(--hover)] border border-[var(--border)]">
                    {[
                        { v: 'list', label: 'Lista', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                        { v: 'calendar', label: 'Calendario', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M4.5 1.5v3M9.5 1.5v3M2 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                        { v: 'kanban', label: 'Kanban', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="3.5" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.1"/><rect x="5.25" y="2" width="3.5" height="7" rx="0.8" stroke="currentColor" strokeWidth="1.1"/><rect x="9.5" y="2" width="3.5" height="8.5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/></svg> }
                    ].map(t => (
                        <button key={t.v} onClick={() => setView(t.v)}
                            className={`flex-1 h-10 rounded-[14px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${currentView === t.v ? 'bg-[var(--card)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                            {t.icon}
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button onClick={onUndo} disabled={!canUndo}
                        className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-20 active:scale-90 transition-all duration-200 hover:bg-[var(--hover)]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 6h7a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 3L3 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo}
                        className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-20 active:scale-90 transition-all duration-200 hover:bg-[var(--hover)]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 6H6a3 3 0 0 0 0 6h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>
            </div>

            <p className="mt-3 text-[13px] text-[var(--text-muted)] leading-tight font-medium">{statsText}</p>
        </header>
    );
}
