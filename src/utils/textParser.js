const categoryMap = {
    'legal': 'personal', 'personal': 'personal', 'work': 'work', 'trabajo': 'work',
    'shopping': 'shopping', 'compras': 'shopping', 'health': 'health', 'salud': 'health',
    'ideas': 'ideas', 'marketing': 'ideas', 'tecnico': 'work', 'técnico': 'work',
    'seguridad': 'health', 'qa': 'personal', 'feature': 'ideas'
};

const priorityMap = { 'p0': 'high', 'p1': 'medium', 'p2': 'low', 'p3': 'none' };

const nonTaskHeaders = ['instrucciones', 'resumen', 'estimación', 'estimacion', 'notas legales', 'checklist de lanzamiento'];

export function parseTasksFromText(text) {
    const lines = text.split('\n');
    const result = [];
    let inNonTaskSection = false;
    let currentPriority = 'none';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 5) continue;

        if (/^#{1,6}\s/.test(trimmed)) {
            const level = trimmed.match(/^(#+)/)[1].length;
            const headerText = trimmed.replace(/^#{1,6}\s*/, '').toLowerCase();

            if (level <= 2) {
                inNonTaskSection = nonTaskHeaders.some(h => headerText.includes(h));
                if (/p0|cr[ií]tico|obligatorio/i.test(trimmed)) currentPriority = 'high';
                else if (/p1|importante/i.test(trimmed)) currentPriority = 'medium';
                else if (/p2|mejora|recomendad/i.test(trimmed)) currentPriority = 'low';
                else if (/p3|future/i.test(trimmed)) currentPriority = 'none';
            }
            continue;
        }

        if (/^[\-=]{3,}/.test(trimmed)) continue;
        if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;

        if (/^\|.*\|$/.test(trimmed)) {
            if (/^\|\s*\*?\*?total\*?\*?\s*\|/i.test(trimmed)) continue;

            const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
            if (cells.length < 2) continue;

            const idCell = cells[0].toLowerCase();
            const isTaskRow = /^[a-z]{1,5}\d+/.test(idCell) || /^p\d/.test(idCell);
            if (!isTaskRow) continue;

            const taskText = cells[1]
                .replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1')
                .replace(/~~(.+?)~~/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();

            if (taskText.length < 5 || taskText.length > 500) continue;
            if (/^\d+[\s\-]*\d*\s*(días?|semanas?|meses?|horas?|minutos?|día|week|month|day)/i.test(taskText)) continue;

            let description = '';
            let categoryName = '';

            if (cells.length >= 5) {
                description = cells[2]
                    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1')
                    .replace(/~~(.+?)~~/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();
                categoryName = cells[3].toLowerCase().trim();
            } else if (cells.length >= 4) {
                categoryName = cells[2].toLowerCase().trim();
            }

            result.push({ text: taskText, category: categoryMap[categoryName] || 'none', priority: currentPriority, notes: description });
            continue;
        }

        if (/^- \[[ x]\]\s/.test(trimmed)) {
            const taskText = trimmed.replace(/^- \[[ x]\]\s*/, '').trim();
            if (taskText.length >= 5 && taskText.length <= 500) {
                result.push({ text: taskText, category: 'none', priority: currentPriority });
            }
            continue;
        }

        if (inNonTaskSection) continue;

        if (/^[-*•]\s/.test(trimmed)) {
            let cleaned = trimmed.replace(/^[-*•]\s*/, '');
            if (cleaned.length >= 5 && cleaned.length <= 500) {
                result.push({ text: cleaned, category: 'none', priority: currentPriority });
            }
        }
    }

    return result;
}
