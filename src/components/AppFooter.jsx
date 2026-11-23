import { useState } from 'react';
import MenuPanel, { MenuDivider } from './MenuPanel';
import { editionNumber } from '../utils/helpers';

const BUTTON = 'h-9 px-3.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] text-[10.5px] font-medium uppercase tracking-[0.1em] disabled:opacity-25 active:scale-[0.98] transition-colors duration-150 hover:text-[var(--text)] hover:border-[var(--border-strong)]';
const ITEM = 'w-full px-3 py-2 text-left text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[var(--radius-sm)] transition-colors duration-150';

/** Pie de página: limpiar completadas, importar/exportar y respaldos. */
export default function AppFooter({ hasCompleted, onClearCompleted, importer, total }) {
    const [open, setOpen] = useState(false);
    const run = (action) => () => { action(); setOpen(false); };

    return (
        <footer className="mt-8 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between gap-2">
                <button disabled={!hasCompleted} onClick={onClearCompleted} className={BUTTON}>
                    Limpiar completadas
                </button>
                <div className="relative">
                    <button onClick={() => setOpen(prev => !prev)} aria-expanded={open} aria-haspopup="menu" className={BUTTON}>
                        Importar / Exportar
                    </button>
                    {open && (
                        <MenuPanel onClose={() => setOpen(false)} className="right-0 bottom-11 min-w-[196px]">
                            <div className="p-1">
                                <button onClick={run(importer.openPdfPicker)} className={ITEM}>Importar PDF</button>
                                <button onClick={run(importer.openTextPicker)} className={ITEM}>Importar texto</button>
                                <button onClick={run(importer.openJsonPicker)} className={ITEM}>Importar JSON</button>
                            </div>
                            <MenuDivider />
                            <div className="p-1">
                                <button onClick={run(importer.exportJson)} className={ITEM}>Exportar JSON</button>
                                <button onClick={run(importer.exportCsv)} className={ITEM}>Exportar CSV</button>
                            </div>
                            <MenuDivider />
                            <div className="p-1">
                                <button onClick={run(importer.exportBackup)} className={ITEM}>Exportar respaldo (todo)</button>
                                <button onClick={run(importer.openBackupPicker)} className={ITEM}>Restaurar respaldo</button>
                            </div>
                            <MenuDivider />
                            <div className="p-1">
                                <button onClick={run(importer.exportCalendar)} className={ITEM + ' text-[var(--accent)]'}>
                                    Exportar al calendario
                                </button>
                            </div>
                        </MenuPanel>
                    )}
                </div>
            </div>
            <p className="mt-6 text-center kicker">
                Mis Tareas · Nº {editionNumber()} · {total} entrada{total === 1 ? '' : 's'}
            </p>
        </footer>
    );
}

/** Inputs de archivo ocultos que dispara el pie. */
export function ImportInputs({ importer }) {
    const onChange = (handler) => (event) => {
        const file = event.target.files[0];
        if (file) {
            handler(file);
            event.target.value = '';
        }
    };

    return (
        <>
            <input ref={importer.pdfInputRef} type="file" accept=".pdf" hidden onChange={onChange(importer.importPdf)} />
            <input ref={importer.textInputRef} type="file" accept=".txt,.md" hidden onChange={onChange(importer.importText)} />
            <input ref={importer.jsonInputRef} type="file" accept=".json" hidden onChange={onChange(importer.importJson)} />
            <input ref={importer.backupInputRef} type="file" accept=".json" hidden onChange={onChange(importer.importBackup)} />
        </>
    );
}
