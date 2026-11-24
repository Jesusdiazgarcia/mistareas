import { categories, priorities, dateKey, formatDate, formatMinutes } from './helpers';

const CATEGORY_WORDS = {
    personal: 'personal',
    trabajo: 'work',
    work: 'work',
    compras: 'shopping',
    shopping: 'shopping',
    salud: 'health',
    health: 'health',
    ideas: 'ideas'
};

const PRIORITY_WORDS = {
    alta: 'high',
    high: 'high',
    media: 'medium',
    medium: 'medium',
    baja: 'low',
    low: 'low'
};

const WEEKDAYS = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    'miércoles': 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    'sábado': 6
};

function shiftDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);
    return next;
}

function nextWeekday(base, weekday) {
    const diff = (weekday - base.getDay() + 7) % 7;
    return shiftDays(base, diff);
}

function clampTime(hours, minutes) {
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) return null;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Extrae fecha, hora, categoría, prioridad y duración del texto de una tarea.
 * Devuelve solo lo detectado: `{ text, dueDate?, dueTime?, category?, priority?, estimatedMinutes? }`.
 */
export function parseQuickAdd(raw, base = new Date()) {
    const found = {};
    let text = ` ${raw} `;

    text = text.replace(/#([\wáéíóúñ]+)/gi, (match, word) => {
        const id = CATEGORY_WORDS[word.toLowerCase()];
        if (!id) return match;
        found.category = id;
        return ' ';
    });

    text = text.replace(/!([\wáéíóúñ]+)/gi, (match, word) => {
        const id = PRIORITY_WORDS[word.toLowerCase()];
        if (!id) return match;
        found.priority = id;
        return ' ';
    });

    text = text.replace(/\b(\d{1,3})\s*(?:min|mins|minutos?)\b/gi, (match, value) => {
        const minutes = Number(value);
        if (minutes <= 0 || minutes > 480) return match;
        found.estimatedMinutes = minutes;
        return ' ';
    });

    text = text.replace(/\b(\d{1,2})\s*(?:h|hr|hrs|horas?)(?:\s*(\d{1,2}))?\b/gi, (match, hours, minutes) => {
        const total = Number(hours) * 60 + Number(minutes || 0);
        if (total <= 0 || total > 480) return match;
        found.estimatedMinutes = total;
        return ' ';
    });

    text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, (match, hours, minutes) => {
        const time = clampTime(Number(hours), Number(minutes));
        if (!time) return match;
        found.dueTime = time;
        return ' ';
    });

    text = text.replace(/\ba\s+las?\s+(\d{1,2})\b/gi, (match, hours) => {
        const time = clampTime(Number(hours), 0);
        if (!time) return match;
        found.dueTime = time;
        return ' ';
    });

    const relatives = [
        [/\bpasado\s+mañana\b/i, 2],
        [/\bmañana\b/i, 1],
        [/\bhoy\b/i, 0]
    ];
    for (const [regex, days] of relatives) {
        if (!found.dueDate && regex.test(text)) {
            found.dueDate = dateKey(shiftDays(base, days));
            text = text.replace(regex, ' ');
        }
    }

    if (!found.dueDate) {
        const weekdayMatch = text.match(/\b(?:el\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i);
        if (weekdayMatch) {
            found.dueDate = dateKey(nextWeekday(base, WEEKDAYS[weekdayMatch[1].toLowerCase()]));
            text = text.replace(weekdayMatch[0], ' ');
        }
    }

    if (!found.dueDate) {
        const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
        if (numeric) {
            const day = Number(numeric[1]);
            const month = Number(numeric[2]) - 1;
            const year = numeric[3]
                ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
                : base.getFullYear();
            const date = new Date(year, month, day);
            if (date.getMonth() === month && date.getDate() === day) {
                found.dueDate = dateKey(date);
                text = text.replace(numeric[0], ' ');
            }
        }
    }

    // Con hora pero sin fecha se asume hoy; si la hora ya pasó, mañana.
    if (found.dueTime && !found.dueDate) {
        const today = dateKey(base);
        const passed = `${today}T${found.dueTime}` < `${today}T${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`;
        found.dueDate = dateKey(shiftDays(base, passed ? 1 : 0));
    }

    return { text: text.replace(/\s+/g, ' ').trim(), ...found };
}

/** Etiquetas legibles de lo detectado, para el preview del composer. */
export function quickAddChips(parsed) {
    if (!parsed) return [];
    const dateInfo = formatDate(parsed.dueDate);
    const category = categories.find(item => item.id === parsed.category);
    const priority = priorities.find(item => item.id === parsed.priority);
    return [
        dateInfo && dateInfo.label,
        parsed.dueTime && `a las ${parsed.dueTime}`,
        category && category.name,
        priority && priority.name,
        parsed.estimatedMinutes && formatMinutes(parsed.estimatedMinutes)
    ].filter(Boolean);
}
