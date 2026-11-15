import { useCallback, useRef } from 'react';
import { generateId, categories, priorities } from '../utils/helpers';
import { parseTasksFromText } from '../utils/textParser';
import { generateTasksICS, downloadICS } from '../utils/calendarExport';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function useImportExport({ tasks, syncTasks, addHistory }) {
    const pdfInputRef = useRef(null);
    const textInputRef = useRef(null);
    const jsonInputRef = useRef(null);

    const handleImportJson = useCallback((file) => {
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
    }, [syncTasks]);

    const handleImportText = useCallback((file) => {
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
    }, [tasks, syncTasks, addHistory]);

    const handleImportPdf = useCallback(async (file) => {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
    }, [tasks, syncTasks, addHistory]);

    const exportJson = useCallback(() => {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `tareas_${new Date().toISOString().slice(0, 10)}.json`;
        a.click(); URL.revokeObjectURL(url);
    }, [tasks]);

    const exportCsv = useCallback(() => {
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
    }, [tasks]);

    const exportToCalendar = useCallback(() => {
        const tasksWithDate = tasks.filter(t => t.dueDate);
        if (tasksWithDate.length === 0) { alert('No hay tareas con fecha para exportar al calendario.'); return; }
        const ics = generateTasksICS(tasksWithDate);
        downloadICS('mis_tareas.ics', ics);
    }, [tasks]);

    return { handleImportJson, handleImportText, handleImportPdf, exportJson, exportCsv, exportToCalendar, pdfInputRef, textInputRef, jsonInputRef };
}
