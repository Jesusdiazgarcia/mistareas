import { useRef } from 'react';
import { categories, priorities, repeats } from '../utils/helpers';
import { createImportedTask } from '../utils/taskModel';
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

/** Importación y exportación de tareas (JSON, CSV, TXT, PDF e ICS). */
export function useImportExport({ tasks, syncTasks, addHistory }) {
    const pdfInputRef = useRef(null);
    const textInputRef = useRef(null);
    const jsonInputRef = useRef(null);

    const appendParsed = (parsed, label) => {
        if (parsed.length === 0) {
            alert('No se encontraron tareas.');
            return;
        }
        syncTasks(prev => [...prev, ...parsed.map((task, index) => createImportedTask(task, index, prev))]);
        addHistory('created', `[${label}] ${parsed.length} tareas`);
    };

    const importJson = (file) => {
        readFile(file, (raw) => {
            try {
                const imported = JSON.parse(raw);
                if (Array.isArray(imported)) syncTasks(imported);
            } catch (error) {
                console.error('Import error:', error);
            }
        });
    };

    const importText = (file) => {
        readFile(file, (raw) => appendParsed(parseTasksFromText(raw), 'Importados'));
    };

    const importPdf = async (file) => {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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
        pdfInputRef,
        textInputRef,
        jsonInputRef,
        importJson,
        importText,
        importPdf,
        exportJson,
        exportCsv,
        exportCalendar,
        exportSelectionToCalendar
    };
}
