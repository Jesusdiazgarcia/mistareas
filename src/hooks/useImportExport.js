import { useRef } from 'react';
import { categories, priorities, repeats } from '../utils/helpers';
import { createImportedTask } from '../utils/taskModel';
import { mergeTasks, parseBackupJson, parseTasksJson } from '../utils/taskSchema';
import { parseTasksFromText } from '../utils/textParser';
import { downloadICS, generateTasksICS } from '../utils/calendarExport';

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function readFile(file, onLoad) {
    const reader = new FileReader();
    reader.onload = (event) => onLoad(event.target.result);
    reader.readAsText(file);
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

/** Importación y exportación de tareas (JSON, CSV, TXT, PDF e ICS) y respaldos. */
export function useImportExport({ tasks, syncTasks, history, syncHistory, addHistory }) {
    const pdfInputRef = useRef(null);
    const textInputRef = useRef(null);
    const jsonInputRef = useRef(null);
    const backupInputRef = useRef(null);

    const appendParsed = (parsed, label) => {
        if (parsed.length === 0) {
            alert('No se encontraron tareas.');
            return;
        }
        syncTasks(prev => [...prev, ...parsed.map((task, index) => createImportedTask(task, index, prev))]);
        addHistory('created', `[${label}] ${parsed.length} tareas`);
    };

    const exportBackup = () => {
        const blob = new Blob([JSON.stringify({
            app: 'mis-tareas',
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks,
            history
        }, null, 2)], { type: 'application/json' });
        downloadBlob(`mis_tareas_respaldo_${today()}.json`, blob);
    };

    /**
     * Importa un JSON de tareas. Nunca reemplaza en silencio: primero valida,
     * luego pide confirmación y, si se reemplaza, descarga un respaldo previo.
     */
    const importJson = (file) => {
        readFile(file, (raw) => {
            const result = parseTasksJson(raw);
            if (!result.ok) {
                alert(`No se importó nada.\n\n${result.error}`);
                return;
            }

            const skipped = result.rejected > 0
                ? `\nSe omitirán ${result.rejected} entrada(s) sin texto válido.`
                : '';
            const replace = window.confirm(
                `El archivo tiene ${result.tasks.length} tarea(s) válida(s).${skipped}\n\n` +
                `Aceptar: reemplazar tus ${tasks.length} tarea(s) actuales (se descargará un respaldo antes).\n` +
                `Cancelar: añadirlas a tu lista actual.`
            );

            if (replace) {
                exportBackup();
                syncTasks(result.tasks);
            } else {
                syncTasks(prev => [...prev, ...mergeTasks(result.tasks, prev)]);
            }
            addHistory('created', `[Importados JSON] ${result.tasks.length} tareas`);
        });
    };

    /** Restaura un respaldo completo validándolo y avisando antes de reemplazar. */
    const importBackup = (file) => {
        readFile(file, (raw) => {
            const result = parseBackupJson(raw);
            if (!result.ok) {
                alert(`No se restauró nada.\n\n${result.error}`);
                return;
            }

            const confirmed = window.confirm(
                `El respaldo tiene ${result.tasks.length} tarea(s) y ${result.history.length} registro(s) de historial.\n\n` +
                `Esto reemplazará tus ${tasks.length} tarea(s) actuales y tu historial.\n` +
                `Se descargará un respaldo del estado actual antes de continuar.`
            );
            if (!confirmed) return;

            exportBackup();
            syncTasks(result.tasks);
            syncHistory(result.history);
        });
    };

    const importText = (file) => {
        readFile(file, (raw) => appendParsed(parseTasksFromText(raw), 'Importados'));
    };

    const importPdf = async (file) => {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
            let fullText = '';
            for (let page = 1; page <= pdf.numPages; page += 1) {
                const content = await (await pdf.getPage(page)).getTextContent();
                fullText += `${content.items.map(item => item.str).join(' ')}\n`;
            }
            appendParsed(parseTasksFromText(fullText), 'Importados PDF');
        } catch (error) {
            console.error('PDF import error:', error);
            alert('Error al leer el PDF.');
        }
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        downloadBlob(`tareas_${today()}.json`, blob);
    };

    const exportCsv = () => {
        const headers = ['Tarea', 'Categoría', 'Prioridad', 'Repetir', 'Fecha límite', 'Completada', 'Subtareas'];
        const rows = tasks.map(t => [
            `"${t.text.replace(/"/g, '""')}"`,
            categories.find(c => c.id === (t.category || 'none'))?.name || '',
            priorities.find(p => p.id === (t.priority || 'none'))?.name || '',
            repeats[t.repeat] || '',
            t.dueDate || '',
            t.completed ? 'Sí' : 'No',
            (t.subtasks || []).length
        ]);
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadBlob(`tareas_${today()}.csv`, new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    };

    const exportCalendar = () => {
        const withDate = tasks.filter(t => t.dueDate);
        if (withDate.length === 0) {
            alert('No hay tareas con fecha para exportar al calendario.');
            return;
        }
        downloadICS('mis_tareas.ics', generateTasksICS(withDate));
    };

    const exportSelectionToCalendar = (ids) => {
        const selected = tasks.filter(t => ids.has(t.id));
        if (selected.length === 0) return;
        downloadICS('tareas_seleccionadas.ics', generateTasksICS(selected));
    };

    return {
        openPdfPicker: () => pdfInputRef.current?.click(),
        openTextPicker: () => textInputRef.current?.click(),
        openJsonPicker: () => jsonInputRef.current?.click(),
        openBackupPicker: () => backupInputRef.current?.click(),
        pdfInputRef,
        textInputRef,
        jsonInputRef,
        backupInputRef,
        importJson,
        importBackup,
        importText,
        importPdf,
        exportJson,
        exportBackup,
        exportCsv,
        exportCalendar,
        exportSelectionToCalendar
    };
}
