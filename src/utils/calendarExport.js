import { categories, priorities, repeats } from './helpers';

function escapeIcs(text) {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatDateICS(dateStr) {
    if (!dateStr) return null;
    return dateStr.replace(/-/g, '');
}

function generateUID() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@mis-tareas`;
}

export function generateTaskICS(task) {
    const cat = categories.find(c => c.id === (task.category || 'none'));
    const pri = priorities.find(p => p.id === (task.priority || 'none'));
    const rep = repeats[task.repeat] || '';

    const descParts = [];
    if (cat && cat.id !== 'none') descParts.push(`Categoría: ${cat.name}`);
    if (pri && pri.id !== 'none') descParts.push(`Prioridad: ${pri.name}`);
    if (rep) descParts.push(`Repetir: ${rep}`);
    if (task.estimatedMinutes > 0) descParts.push(`Estimado: ${task.estimatedMinutes}min`);
    if (task.notes && task.notes.trim()) descParts.push(`\nNotas: ${task.notes}`);
    const description = descParts.join('\\n');

    const dateVal = task.dueDate ? formatDateICS(task.dueDate) : formatDateICS(new Date().toISOString().slice(0, 10));
    const uid = generateUID();
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    let rrule = '';
    if (task.repeat && task.repeat !== 'none') {
        const map = { daily: 'FREQ=DAILY', weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
        rrule = `\nRRULE:${map[task.repeat]}`;
    }

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mis Tareas//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dateVal}
DTEND;VALUE=DATE:${dateVal}
SUMMARY:${escapeIcs(task.text)}
DESCRIPTION:${escapeIcs(description)}${rrule}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`;
}

export function downloadICS(filename, icsContent) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function generateTasksICS(tasks) {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const events = tasks.map(task => {
        const cat = categories.find(c => c.id === (task.category || 'none'));
        const pri = priorities.find(p => p.id === (task.priority || 'none'));
        const rep = repeats[task.repeat] || '';

        const descParts = [];
        if (cat && cat.id !== 'none') descParts.push(`Categoría: ${cat.name}`);
        if (pri && pri.id !== 'none') descParts.push(`Prioridad: ${pri.name}`);
        if (rep) descParts.push(`Repetir: ${rep}`);
        if (task.estimatedMinutes > 0) descParts.push(`Estimado: ${task.estimatedMinutes}min`);
        if (task.notes && task.notes.trim()) descParts.push(`\nNotas: ${task.notes}`);
        const description = descParts.join('\\n');

        const dateVal = task.dueDate ? formatDateICS(task.dueDate) : formatDateICS(new Date().toISOString().slice(0, 10));
        const uid = generateUID();

        let rrule = '';
        if (task.repeat && task.repeat !== 'none') {
            const map = { daily: 'FREQ=DAILY', weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
            rrule = `\nRRULE:${map[task.repeat]}`;
        }

        return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dateVal}
DTEND;VALUE=DATE:${dateVal}
SUMMARY:${escapeIcs(task.text)}
DESCRIPTION:${escapeIcs(description)}${rrule}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mis Tareas//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;
}
